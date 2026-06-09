import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../components';
import { CreateAccountGroupDialogDataService } from './create-account-group-dialog.data-service';

export interface CreateAccountGroupDialogInput {
  organizationId: string;
}

export interface CreateAccountGroupDialogOutput {
  created: boolean;
  group?: {
    id: string;
    name: string;
    description: string;
  };
}

@Component({
  selector: 'app-create-account-group-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonComponent],
  template: `
    <div class="bg-white rounded-lg shadow-xl p-4">
      <h2 i18n class="text-sm font-semibold text-gray-900 mb-4">
        Kontengruppe erstellen
      </h2>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="space-y-3">
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
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <app-button variant="secondary" (clicked)="cancel()">
            <ng-container i18n>Abbrechen</ng-container>
          </app-button>
          <app-button
            type="submit"
            [disabled]="form.invalid"
            [loading]="creating()"
          >
            <ng-container i18n>Erstellen</ng-container>
          </app-button>
        </div>
      </form>
    </div>
  `,
})
export class CreateAccountGroupDialogComponent {
  private readonly dialogRef = inject(DialogRef<CreateAccountGroupDialogOutput>);
  private readonly dataService = inject(CreateAccountGroupDialogDataService);
  private readonly fb = inject(FormBuilder);
  readonly data = inject<CreateAccountGroupDialogInput>(DIALOG_DATA);

  readonly creating = signal(false);

  readonly form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  cancel(): void {
    this.dialogRef.close({ created: false });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.creating.set(true);
    const { name, description } = this.form.value;

    this.dataService.createAccountGroup(this.data.organizationId, name, description || '').subscribe({
      next: (group) => {
        this.creating.set(false);
        this.dialogRef.close({
          created: true,
          group,
        });
      },
      error: () => {
        this.creating.set(false);
      },
    });
  }
}
