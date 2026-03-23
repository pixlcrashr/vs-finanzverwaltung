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
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
  StatusBadgeComponent,
} from '../../../shared/components';
import { formatDateShort, formatCurrency } from '../../../shared/utils';
import { Transaction, TransactionAccountAssignment, Account } from '../../../shared/models';
import { TransactionEditDataService } from './transaction-edit.data-service';

@Component({
  selector: 'app-transaction-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeaderComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs">
        <app-button variant="secondary" (clicked)="goBack()">
          Zurück zum Journal
        </app-button>
      </app-page-header>

      <div class="flex flex-1 justify-center overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" text="Transaktion wird geladen..." />
        } @else if (transaction()) {
          <div class="w-full max-w-4xl space-y-3">
            <!-- Transaction Details Card -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="text-sm font-semibold text-gray-900 mb-4">
                Transaktionsdetails
              </h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Left Column -->
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">
                      Belegdatum
                    </label>
                    <p class="text-sm text-gray-900">
                      {{ formatDate(transaction()!.documentDate) }}
                    </p>
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">
                      Gebucht am
                    </label>
                    <p class="text-sm text-gray-900">
                      {{ formatDate(transaction()!.bookedAt) }}
                    </p>
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">
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
                    <label class="block text-xs font-medium text-gray-500 mb-1">
                      Soll-Konto
                    </label>
                    <p class="text-sm text-gray-900">
                      {{ transaction()!.debitAccountCode }} {{ transaction()!.debitAccountName }}
                    </p>
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">
                      Haben-Konto
                    </label>
                    <p class="text-sm text-gray-900">
                      {{ transaction()!.creditAccountCode }} {{ transaction()!.creditAccountName }}
                    </p>
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-gray-500 mb-1">
                      Zuordnungsstatus
                    </label>
                    <app-status-badge size="sm" [variant]="isFullyAssigned() ? 'success' : 'warning'">
                      {{ isFullyAssigned() ? 'Vollständig zugeordnet' : 'Teilweise zugeordnet' }}
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
                  Beschreibung
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
                    {{ saving() ? 'Speichern...' : 'Speichern' }}
                  </app-button>
                </div>
              </div>
            </div>

            <!-- Account Assignments Card -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-sm font-semibold text-gray-900">
                  Kontenzuordnungen
                </h2>
                <div class="text-xs" [class.text-red-500]="assignmentPercentage() > 100" [class.text-gray-500]="assignmentPercentage() <= 100">
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
                <p class="text-xs text-gray-500 mt-1">
                  {{ assignmentPercentage().toFixed(1) }}% zugeordnet
                </p>
              </div>

              <!-- Assignments Table -->
              @if (transaction()!.accountAssignments.length > 0) {
                <div class="overflow-x-auto mb-4">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-gray-200">
                        <th class="text-left py-2 px-3 text-xs font-medium text-gray-500">
                          Konto
                        </th>
                        <th class="text-right py-2 px-3 text-xs font-medium text-gray-500">
                          Betrag
                        </th>
                        <th class="text-right py-2 px-3 text-xs font-medium text-gray-500">
                          Aktionen
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
                          <td class="py-3 px-3 text-right">
                            <button
                              type="button"
                              class="text-xs text-red-600 hover:underline"
                              [disabled]="removing()"
                              (click)="removeAssignment(assignment)"
                            >
                              Entfernen
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              } @else {
                <p class="text-xs text-gray-500 text-center py-4 mb-4">
                  Keine Kontenzuordnungen vorhanden.
                </p>
              }

              <!-- Add Assignment Form -->
              <div class="border-t border-gray-200 pt-4">
                <h3 class="text-xs font-medium text-gray-900 mb-3">
                  Neue Zuordnung hinzufügen
                </h3>
                <div class="flex flex-col sm:flex-row gap-2">
                  <select
                    [(ngModel)]="selectedAccountId"
                    class="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Konto auswählen...</option>
                    @for (account of availableAccounts(); track account.id) {
                      <option [value]="account.id">
                        {{ account.code }} {{ account.name }}
                      </option>
                    }
                  </select>
                  <input
                    type="number"
                    [(ngModel)]="assignmentValue"
                    placeholder="Betrag"
                    step="0.01"
                    min="0"
                    class="w-full sm:w-32 px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <app-button
                    variant="primary"
                    [disabled]="adding() || !selectedAccountId || !assignmentValue"
                    (clicked)="addAssignment()"
                  >
                    {{ adding() ? 'Hinzufügen...' : 'Hinzufügen' }}
                  </app-button>
                </div>
                @if (remainingAmount() > 0) {
                  <button
                    type="button"
                    class="mt-2 text-xs text-blue-600 hover:underline"
                    (click)="fillRemainingAmount()"
                  >
                    Restbetrag übernehmen ({{ formatAmount(remainingAmount().toFixed(2)) }})
                  </button>
                }
              </div>
            </div>

            <!-- Metadata -->
            <div class="text-xs text-gray-500">
              Zuletzt aktualisiert: {{ formatDate(transaction()!.updatedAt) }}
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class TransactionEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dataService = inject(TransactionEditDataService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly adding = signal(false);
  readonly removing = signal(false);
  readonly transaction = signal<Transaction | null>(null);
  readonly availableAccounts = signal<Account[]>([]);

  description = '';
  selectedAccountId = '';
  assignmentValue: number | null = null;

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Journal', path: '/journal' },
    { label: 'Transaktion bearbeiten' },
  ];

  readonly Math = Math;

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

  readonly remainingAmount = computed(() => {
    const tx = this.transaction();
    if (!tx) return 0;
    const total = parseFloat(tx.amount);
    const assigned = parseFloat(this.assignedTotal());
    return Math.max(0, total - assigned);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTransaction(id);
      this.loadAvailableAccounts();
    }
  }

  private loadTransaction(id: string): void {
    this.dataService.getTransaction(id).subscribe({
      next: (transaction) => {
        this.transaction.set(transaction);
        this.description = transaction.description;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private loadAvailableAccounts(): void {
    this.dataService.getAvailableAccounts().subscribe({
      next: (accounts) => {
        this.availableAccounts.set(accounts);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/journal']);
  }

  saveDescription(): void {
    const tx = this.transaction();
    if (!tx) return;

    this.saving.set(true);
    this.dataService.updateTransaction(tx.id, this.description).subscribe({
      next: (updated) => {
        this.transaction.set(updated);
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  addAssignment(): void {
    const tx = this.transaction();
    if (!tx || !this.selectedAccountId || !this.assignmentValue) return;

    this.adding.set(true);
    const value = this.assignmentValue.toFixed(2);

    this.dataService.addAssignment(tx.id, this.selectedAccountId, value).subscribe({
      next: () => {
        // Reload transaction to get updated assignments
        this.dataService.getTransaction(tx.id).subscribe({
          next: (updated) => {
            this.transaction.set(updated);
            this.selectedAccountId = '';
            this.assignmentValue = null;
            this.adding.set(false);
          },
        });
      },
      error: () => {
        this.adding.set(false);
      },
    });
  }

  removeAssignment(assignment: TransactionAccountAssignment): void {
    const tx = this.transaction();
    if (!tx) return;

    this.removing.set(true);
    this.dataService.removeAssignment(tx.id, assignment.id).subscribe({
      next: () => {
        // Reload transaction to get updated assignments
        this.dataService.getTransaction(tx.id).subscribe({
          next: (updated) => {
            this.transaction.set(updated);
            this.removing.set(false);
          },
        });
      },
      error: () => {
        this.removing.set(false);
      },
    });
  }

  fillRemainingAmount(): void {
    this.assignmentValue = this.remainingAmount();
  }

  formatDate(date: Date): string {
    return formatDateShort(date);
  }

  formatAmount(value: string): string {
    const num = parseFloat(value);
    return formatCurrency(num);
  }
}
