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
  StatusBadgeComponent,
  NotificationService,
} from '../../../shared/components';
import { formatDateShort, formatCurrency } from '../../../shared/utils';
import { Transaction } from '../../../shared/models';
import { TransactionEditDataService } from './transaction-edit.data-service';

@Component({
  selector: 'app-transaction-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageContentLayoutComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
  ],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs">
      <div layout-content class="flex flex-1 justify-center">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Transaktion wird geladen..." />
        } @else if (transaction()) {
          <div class="w-full max-w-4xl space-y-3">
            <!-- Transaction Details Card -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 i18n class="text-sm font-semibold text-gray-900 mb-4">
                Transaktionsdetails
              </h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Left Column -->
                <div class="space-y-3">
                  <div>
                    <label i18n class="block text-xs font-medium text-gray-500 mb-1">
                      Belegdatum
                    </label>
                    <p class="text-sm text-gray-900">
                      {{ formatDate(transaction()!.documentDate) }}
                    </p>
                  </div>

                  <div>
                    <label i18n class="block text-xs font-medium text-gray-500 mb-1">
                      Gebucht am
                    </label>
                    <p class="text-sm text-gray-900">
                      {{ formatDate(transaction()!.bookedAt) }}
                    </p>
                  </div>

                  <div>
                    <label i18n class="block text-xs font-medium text-gray-500 mb-1">
                      Betrag
                    </label>
                    <p class="text-xl font-semibold text-gray-900">
                      {{ formatAmount(transaction()!.amount) }}
                    </p>
                  </div>
                </div>

                <!-- Right Column -->
                <div class="space-y-3">
                  <div>
                    <label i18n class="block text-xs font-medium text-gray-500 mb-1">
                      Soll-Konto
                    </label>
                    <p class="text-sm text-gray-900">
                      {{ transaction()!.debitAccountCode }} {{ transaction()!.debitAccountName }}
                    </p>
                  </div>

                  <div>
                    <label i18n class="block text-xs font-medium text-gray-500 mb-1">
                      Haben-Konto
                    </label>
                    <p class="text-sm text-gray-900">
                      {{ transaction()!.creditAccountCode }} {{ transaction()!.creditAccountName }}
                    </p>
                  </div>

                  <div>
                    <label i18n class="block text-xs font-medium text-gray-500 mb-1">
                      Zuordnungsstatus
                    </label>
                    <app-status-badge size="sm" [variant]="isFullyAssigned() ? 'success' : 'warning'">
                      <ng-container i18n>{{ isFullyAssigned() ? 'Vollständig zugeordnet' : 'Teilweise zugeordnet' }}</ng-container>
                    </app-status-badge>
                  </div>
                </div>
              </div>

              <!-- Description Field -->
              <div class="mt-4">
                <label
                  for="description"
                  class="block text-xs font-medium text-gray-500 mb-1"
                >
                  <ng-container i18n>Beschreibung</ng-container>
                </label>
                <div class="flex gap-2">
                  <input
                    id="description"
                    type="text"
                    [(ngModel)]="description"
                    class="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <app-button
                    variant="primary"
                    [disabled]="saving() || description === transaction()!.description"
                    (clicked)="saveDescription()"
                  >
                    <ng-container i18n>{{ saving() ? 'Speichern...' : 'Speichern' }}</ng-container>
                  </app-button>
                </div>
              </div>
            </div>

            <!-- Account Assignments Card -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <div class="flex items-center justify-between mb-4">
                <h2 i18n class="text-sm font-semibold text-gray-900">
                  Kontenzuordnungen
                </h2>
                <div i18n class="text-xs" [class.text-red-500]="assignmentPercentage() > 100" [class.text-gray-500]="assignmentPercentage() <= 100">
                  {{ formatAmount(assignedTotal()) }} von {{ formatAmount(transaction()!.amount) }} zugeordnet
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="mb-4">
                <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    class="h-full transition-all duration-300"
                    [class]="assignmentPercentage() === 100 ? 'bg-green-500' : assignmentPercentage() > 100 ? 'bg-red-500' : 'bg-amber-500'"
                    [style.width.%]="Math.min(assignmentPercentage(), 100)"
                  ></div>
                </div>
                <p i18n class="text-xs text-gray-500 mt-1">
                  {{ assignmentPercentage().toFixed(1) }}% zugeordnet
                </p>
              </div>

              <!-- Assignments Table -->
              @if (transaction()!.accountAssignments.length > 0) {
                <div class="overflow-x-auto mb-4">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-gray-200">
                        <th i18n class="text-left py-2 px-3 text-xs font-medium text-gray-500">
                          Konto
                        </th>
                        <th i18n class="text-right py-2 px-3 text-xs font-medium text-gray-500">
                          Betrag
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (assignment of transaction()!.accountAssignments; track assignment.id) {
                        <tr class="border-b border-gray-200 last:border-b-0">
                          <td class="py-3 px-3 text-sm text-gray-900">
                            {{ assignment.accountCode }} {{ assignment.accountName }}
                          </td>
                          <td class="py-3 px-3 text-right text-sm text-gray-900">
                            {{ formatAmount(assignment.value) }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p i18n class="text-xs text-gray-500 text-center py-4 mb-4">
                  Keine Kontenzuordnungen vorhanden.
                </p>
              }
            </div>

            <!-- Metadata -->
            <div i18n class="text-xs text-gray-500">
              Zuletzt aktualisiert: {{ formatDate(transaction()!.updatedAt) }}
            </div>
          </div>
        }
      </div>
    </app-page-content-layout>
  `,
})
export class TransactionEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dataService = inject(TransactionEditDataService);
  private readonly notifications = inject(NotificationService);

  private orgId = '';

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly transaction = signal<Transaction | null>(null);

  description = '';

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: $localize`Journal`, path: '' },
    { label: $localize`Transaktion bearbeiten` },
  ];

  readonly Math = Math;

  private getOrgId(): string {
    let snapshot = this.route.snapshot;
    while (snapshot) {
      const id = snapshot.paramMap.get('orgId');
      if (id) return id;
      snapshot = snapshot.parent!;
    }
    return '';
  }

  readonly assignedTotal = computed(() => {
    const tx = this.transaction();
    if (!tx) return '0.00';
    const total = tx.accountAssignments.reduce(
      (sum, a) => sum + parseFloat(a.value),
      0
    );
    return total.toFixed(2);
  });

  readonly assignmentPercentage = computed(() => {
    const tx = this.transaction();
    if (!tx) return 0;
    const total = parseFloat(tx.amount);
    const assigned = parseFloat(this.assignedTotal());
    return total > 0 ? (assigned / total) * 100 : 0;
  });

  readonly isFullyAssigned = computed(() => {
    return Math.abs(this.assignmentPercentage() - 100) < 0.01;
  });

  ngOnInit(): void {
    this.orgId = this.getOrgId();
    this.breadcrumbs[0].path = `/organizations/${this.orgId}/journal`;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTransaction(id);
    }
  }

  private loadTransaction(id: string): void {
    this.dataService.getTransaction(this.orgId, id).subscribe({
      next: (transaction) => {
        this.transaction.set(transaction);
        this.description = transaction.description;
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden der Buchung`);
        this.loading.set(false);
      },
    });
  }

  saveDescription(): void {
    const tx = this.transaction();
    if (!tx) return;

    this.saving.set(true);
    this.dataService.updateTransaction(this.orgId, tx.id, this.description).subscribe({
      next: (updated) => {
        this.transaction.set(updated);
        this.saving.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Speichern der Buchung`);
        this.saving.set(false);
      },
    });
  }

  formatDate(date: Date): string {
    return formatDateShort(date);
  }

  formatAmount(value: string): string {
    const num = parseFloat(value);
    return formatCurrency(num);
  }
}
