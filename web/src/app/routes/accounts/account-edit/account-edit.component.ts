import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  StatusBadgeComponent,
  LoadingSpinnerComponent,
} from '../../../shared/components';
import { formatDateTime } from '../../../shared/utils';
import { AccountEditDataService, AccountDetails } from './account-edit.data-service';

@Component({
  selector: 'app-account-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    PageHeaderComponent,
    ButtonComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs()" />

      <div class="flex flex-1 justify-center overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" text="Konto wird geladen..." />
        } @else if (account()) {
          <div class="w-full max-w-3xl space-y-3">
            <!-- Account Form -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-sm font-semibold text-gray-900">
                  Konto Details
                </h2>
                <app-status-badge size="sm" [variant]="account()!.isArchived ? 'neutral' : 'success'">
                  {{ account()!.isArchived ? 'Archiviert' : 'Aktiv' }}
                </app-status-badge>
              </div>

              <form [formGroup]="accountForm" (ngSubmit)="saveAccount()">
                <div class="space-y-3">
                  <div>
                    <label
                      for="code"
                      class="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Kontonummer
                    </label>
                    <input
                      id="code"
                      type="text"
                      formControlName="code"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      for="name"
                      class="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Name
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
                      Beschreibung
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
                  <a
                    routerLink="/accounts"
                    class="px-2 py-1 text-xs font-medium text-gray-900 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Abbrechen
                  </a>
                  <app-button
                    type="submit"
                    [disabled]="accountForm.invalid || accountForm.pristine"
                    [loading]="saving()"
                  >
                    Speichern
                  </app-button>
                </div>
              </form>
            </div>

            <!-- Metadata -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="text-sm font-semibold text-gray-900 mb-4">
                Informationen
              </h2>
              <dl class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt class="text-xs text-gray-500">Erstellt am</dt>
                  <dd class="text-sm text-gray-900">
                    {{ formatDateTime(account()!.createdAt) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-gray-500">Zuletzt geändert</dt>
                  <dd class="text-sm text-gray-900">
                    {{ formatDateTime(account()!.updatedAt) }}
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-gray-500">Hierarchieebene</dt>
                  <dd class="text-sm text-gray-900">{{ account()!.depth + 1 }}</dd>
                </div>
                <div>
                  <dt class="text-xs text-gray-500">Unterkonten</dt>
                  <dd class="text-sm text-gray-900">{{ account()!.children.length }}</dd>
                </div>
              </dl>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AccountEditComponent implements OnInit {
  private readonly dataService = inject(AccountEditDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly account = signal<AccountDetails | null>(null);

  readonly breadcrumbs = signal<BreadcrumbItem[]>([
    { label: 'Haushaltskonten', path: '/accounts' },
    { label: 'Laden...' },
  ]);

  readonly accountForm: FormGroup;

  constructor() {
    this.accountForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAccount(id);
    }
  }

  private loadAccount(id: string): void {
    this.dataService.getAccount(id).subscribe({
      next: (account) => {
        this.account.set(account);
        this.accountForm.patchValue({
          code: account.code,
          name: account.name,
          description: account.description,
        });
        this.breadcrumbs.set([
          { label: 'Haushaltskonten', path: '/accounts' },
          { label: `${account.code} - ${account.name}` },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/accounts']);
      },
    });
  }

  saveAccount(): void {
    if (this.accountForm.invalid) return;

    this.saving.set(true);
    const account = this.account()!;
    const { code, name, description } = this.accountForm.value;

    this.dataService.updateAccount(account.id, name, code, description).subscribe({
      next: () => {
        this.saving.set(false);
        this.accountForm.markAsPristine();
        this.loadAccount(account.id);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  formatDateTime = formatDateTime;
}
