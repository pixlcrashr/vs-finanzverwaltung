import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../components';
import { CreateAccountDialogDataService } from './create-account-dialog.data-service';

export interface CreateAccountDialogInput {
  organizationId: string;
}

export interface ParentAccountOption {
  id: string;
  code: string;
  name: string;
  depth: number;
}

export interface CreatedAccount {
  id: string;
  code: string;
  name: string;
  description: string;
  parentAccountId: string | null;
}

export interface CreateAccountDialogOutput {
  created: boolean;
  account?: CreatedAccount;
}

@Component({
  selector: 'app-create-account-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonComponent],
  template: `
    <div class="bg-white rounded-lg shadow-xl p-4">
      <h2 class="text-sm font-semibold text-gray-900 mb-4">
        <ng-container i18n>Konto erstellen</ng-container>
      </h2>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <fieldset [disabled]="loadingAccounts()">
          <div class="space-y-3">
            <div>
              <label
                for="code"
                class="block text-xs font-medium text-gray-700 mb-1"
              >
                <ng-container i18n>Kontonummer</ng-container>
              </label>
              <input
                id="code"
                type="text"
                formControlName="code"
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>

            <div>
              <label
                for="name"
                class="block text-xs font-medium text-gray-700 mb-1"
              >
                <ng-container i18n>Name</ng-container>
              </label>
              <input
                id="name"
                type="text"
                formControlName="name"
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              />
            </div>

            <div>
              <label
                for="description"
                class="block text-xs font-medium text-gray-700 mb-1"
              >
                <ng-container i18n>Beschreibung</ng-container>
              </label>
              <textarea
                id="description"
                formControlName="description"
                rows="2"
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              ></textarea>
            </div>

            <div>
              <label
                for="parentAccount"
                class="block text-xs font-medium text-gray-700 mb-1"
              >
                <ng-container i18n>Übergeordnetes Konto (optional)</ng-container>
              </label>
              <select
                id="parentAccount"
                formControlName="parentAccountId"
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option i18n value="">Kein übergeordnetes Konto</option>
                @for (account of parentAccounts(); track account.id) {
                  <option [value]="account.id">
                    {{ indent(account.depth) }}{{ account.code }} - {{ account.name }}
                  </option>
                }
              </select>
            </div>
          </div>
        </fieldset>

        <div class="flex justify-end gap-2 mt-4">
          <app-button variant="secondary" (clicked)="cancel()">
            <ng-container i18n>Abbrechen</ng-container>
          </app-button>
          <app-button
            type="submit"
            [disabled]="form.invalid || loadingAccounts()"
            [loading]="creating()"
          >
            <ng-container i18n>Erstellen</ng-container>
          </app-button>
        </div>
      </form>
    </div>
  `,
})
export class CreateAccountDialogComponent implements OnInit {
  private readonly dialogRef = inject(DialogRef<CreateAccountDialogOutput>);
  private readonly dataService = inject(CreateAccountDialogDataService);
  private readonly fb = inject(FormBuilder);
  readonly data = inject<CreateAccountDialogInput>(DIALOG_DATA);

  readonly loadingAccounts = signal(true);
  readonly creating = signal(false);
  readonly parentAccounts = signal<ParentAccountOption[]>([]);

  readonly form: FormGroup = this.fb.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    description: [''],
    parentAccountId: [''],
  });

  ngOnInit(): void {
    this.loadParentAccounts();
  }

  private loadParentAccounts(): void {
    this.dataService.listParentAccounts(this.data.organizationId).subscribe({
      next: (accounts) => {
        this.parentAccounts.set(accounts);
        this.loadingAccounts.set(false);
      },
      error: () => {
        this.loadingAccounts.set(false);
      },
    });
  }

  indent(depth: number): string {
    return '\u00A0\u00A0'.repeat(depth);
  }

  cancel(): void {
    this.dialogRef.close({ created: false });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.creating.set(true);
    const { code, name, description, parentAccountId } = this.form.value;

    this.dataService
      .createAccount(this.data.organizationId, name, code, description || '', parentAccountId || null)
      .subscribe({
        next: (account) => {
          this.creating.set(false);
          this.dialogRef.close({
            created: true,
            account,
          });
        },
        error: () => {
          this.creating.set(false);
        },
      });
  }
}
