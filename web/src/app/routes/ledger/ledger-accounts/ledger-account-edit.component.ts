import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  PageContentLayoutComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
  NotificationService,
} from '../../../shared/components';
import {
  LedgerAccountEditDataService,
  LedgerAccountDetail,
  UpdateLedgerAccountRequest,
} from './ledger-account-edit.data-service';
import { V1AccountType } from '../../../../lib/api/models/v1account-type';

@Component({
  selector: 'app-ledger-account-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageContentLayoutComponent, ButtonComponent, LoadingSpinnerComponent],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs()">
      <div layout-content>
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Konto wird geladen..." />
        } @else if (account()) {
          @let acc = account()!;
          <div class="max-w-2xl mx-auto">
            <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div class="space-y-4">
                <!-- Read-only fields -->
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <ng-container i18n>Kontonummer</ng-container>
                    </label>
                    <input
                      type="text"
                      [value]="acc.code"
                      disabled
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <ng-container i18n>Typ</ng-container>
                    </label>
                    <input
                      type="text"
                      [value]="formatAccountType(acc.accountType)"
                      disabled
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    />
                  </div>
                </div>

                <!-- Editable fields -->
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <ng-container i18n>Anzeigename</ng-container>
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="displayName"
                    placeholder="Optionaler Anzeigename"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <ng-container i18n>Beschreibung</ng-container>
                  </label>
                  <textarea
                    [(ngModel)]="displayDescription"
                    rows="3"
                    placeholder="Optionale Beschreibung"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex justify-end gap-2 mt-6">
                <app-button variant="secondary" (clicked)="goBack()">
                  <ng-container i18n>Abbrechen</ng-container>
                </app-button>
                <app-button
                  [disabled]="saving()"
                  [loading]="saving()"
                  (clicked)="save()"
                >
                  <ng-container i18n>Speichern</ng-container>
                </app-button>
              </div>
            </div>
          </div>
        }
      </div>
    </app-page-content-layout>
  `,
})
export class LedgerAccountEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dataService = inject(LedgerAccountEditDataService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly account = signal<LedgerAccountDetail | null>(null);

  displayName = '';
  displayDescription = '';

  readonly orgId = signal<string>('');
  readonly accountId = signal<string>('');

  readonly breadcrumbs = computed<BreadcrumbItem[]>(() => [
    { label: $localize`Ledger Konten`, path: `/organizations/${this.orgId()}/ledgerAccounts` },
    { label: this.account()?.displayName || this.account()?.code || $localize`Bearbeiten`, path: '' },
  ]);

  ngOnInit(): void {
    const orgId = this.route.snapshot.paramMap.get('orgId');
    const id = this.route.snapshot.paramMap.get('id');

    if (orgId && id) {
      this.orgId.set(orgId);
      this.accountId.set(id);
      this.loadAccount(orgId, id);
    }
  }

  private loadAccount(orgId: string, id: string): void {
    this.loading.set(true);
    this.dataService.getLedgerAccount(orgId, id).subscribe({
      next: (account) => {
        this.account.set(account);
        this.displayName = account.displayName || '';
        this.displayDescription = account.displayDescription || '';
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden des Ledger-Kontos`);
        this.loading.set(false);
      },
    });
  }

  save(): void {
    const orgId = this.orgId();
    const account = this.account();
    if (!orgId || !account) return;

    this.saving.set(true);

    const request: UpdateLedgerAccountRequest = {
      id: account.id,
      displayName: this.displayName || undefined,
      displayDescription: this.displayDescription || undefined,
      etag: account.etag,
    };

    this.dataService.updateLedgerAccount(orgId, request).subscribe({
      next: () => {
        this.notifications.success($localize`Ledger-Konto erfolgreich aktualisiert`);
        this.saving.set(false);
        this.goBack();
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Speichern des Ledger-Kontos`);
        this.saving.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/organizations', this.orgId(), 'ledgerAccounts']);
  }

  formatAccountType(type: V1AccountType): string {
    const typeMap: Record<string, string> = {
      ACCOUNT_TYPE_ASSET: 'Aktiv',
      ACCOUNT_TYPE_LIABILITY: 'Passiv',
      ACCOUNT_TYPE_EQUITY: 'Eigenkapital',
      ACCOUNT_TYPE_REVENUE: 'Ertrag',
      ACCOUNT_TYPE_EXPENSE: 'Aufwand',
      ACCOUNT_TYPE_SYSTEM: 'System',
    };
    return typeMap[type] || type;
  }
}
