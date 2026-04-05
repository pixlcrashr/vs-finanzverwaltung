import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  StatusBadgeComponent,
  LoadingSpinnerComponent,
  EmptyStateComponent,
  NotificationService,
} from '../../../shared/components';
import { formatDateShort } from '../../../shared/utils';
import {
  JournalListDataService,
  JournalEntry,
  JournalEntryFilters,
  JournalAssignmentStatus,
} from './journal-list.data-service';

@Component({
  selector: 'app-journal-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    PageHeaderComponent,
    ButtonComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs">
        <a
          routerLink="/journal/import"
          class="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:opacity-90"
        >
          <ng-container i18n>Import</ng-container>
        </a>
      </app-page-header>

      <div class="flex flex-1 justify-center overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Journal wird geladen..." />
        } @else {
          <div class="w-full space-y-3">
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                <div>
                  <label i18n for="afterDate" class="block text-xs font-medium text-gray-700 mb-1">
                    Nach Datum
                  </label>
                  <input
                    id="afterDate"
                    type="date"
                    [(ngModel)]="filterAfterDate"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label i18n for="beforeDate" class="block text-xs font-medium text-gray-700 mb-1">
                    Vor Datum
                  </label>
                  <input
                    id="beforeDate"
                    type="date"
                    [(ngModel)]="filterBeforeDate"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div class="xl:col-span-2">
                  <label i18n for="searchQuery" class="block text-xs font-medium text-gray-700 mb-1">
                    Allgemeine Suche
                  </label>
                  <input
                    id="searchQuery"
                    type="text"
                    [(ngModel)]="filterQuery"
                    placeholder="Belegnummer, Buchungstext, Konto ..."
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label i18n for="assignmentStatus" class="block text-xs font-medium text-gray-700 mb-1">
                    Zuordnungsstatus
                  </label>
                  <select
                    id="assignmentStatus"
                    [(ngModel)]="filterAssignmentStatus"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option i18n value="all">Alle</option>
                    <option i18n value="ignored">Ignoriert</option>
                    <option i18n value="assigned">Vollständig zugeordnet</option>
                    <option i18n value="partial">Teilweise zugeordnet</option>
                    <option i18n value="open">Offen</option>
                  </select>
                </div>
              </div>

              <div class="mt-3 flex items-center justify-end gap-2">
                <app-button variant="secondary" (clicked)="resetFilters()">
                  <ng-container i18n>Zurücksetzen</ng-container>
                </app-button>
                <app-button variant="primary" (clicked)="applyFilters()">
                  <ng-container i18n>Filtern</ng-container>
                </app-button>
              </div>
            </div>

            @if (entries().length === 0) {
              <app-empty-state
                i18n-title title="Keine Buchungen gefunden"
                [description]="hasActiveFilters() ? filterActiveDescription : filterInactiveDescription"
              >
                @if (hasActiveFilters()) {
                  <app-button variant="secondary" (clicked)="resetFilters()">
                    <ng-container i18n>Filter zurücksetzen</ng-container>
                  </app-button>
                } @else {
                  <a
                    routerLink="/journal/import"
                    class="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:opacity-90"
                  >
                    <ng-container i18n>Buchungen importieren</ng-container>
                  </a>
                }
              </app-empty-state>
            } @else {
            <div class="bg-white rounded-lg border border-gray-200">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        <ng-container i18n>Belegdatum</ng-container>
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        <ng-container i18n>Belegnummer</ng-container>
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        <ng-container i18n>Soll</ng-container>
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        <ng-container i18n>Haben</ng-container>
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-right text-gray-500"
                      >
                        <ng-container i18n>Betrag</ng-container>
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        <ng-container i18n>Beschreibung</ng-container>
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        <ng-container i18n>Haushaltskonten</ng-container>
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        <ng-container i18n>Status</ng-container>
                      </th>
                      <th scope="col" class="px-3 py-2 text-right">
                        <span class="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    @for (entry of entries(); track trackById(entry)) {
                      <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-3 py-2 text-xs text-gray-900">{{ formatDate(entry.documentDate) }}</td>
                        <td class="px-3 py-2 text-xs text-gray-900">{{ entry.reference }}</td>
                        <td class="px-3 py-2 text-xs text-gray-900">
                          <span [title]="entry.debitAccountName">{{ entry.debitAccountCode }}</span>
                        </td>
                        <td class="px-3 py-2 text-xs text-gray-900">
                          <span [title]="entry.creditAccountName">{{ entry.creditAccountCode }}</span>
                        </td>
                        <td class="px-3 py-2 text-xs text-right text-gray-900">{{ formatAmount(entry.amount) }}</td>
                        <td class="px-3 py-2 text-xs text-gray-900">
                          <div class="max-w-sm truncate" [title]="entry.description">
                            {{ entry.description }}
                          </div>
                        </td>
                        <td class="px-3 py-2 text-xs text-gray-900">
                          @if (entry.accountAssignments.length === 0) {
                            @if (entry.assignmentStatus === 'ignored') {
                              <span i18n class="text-gray-500 italic">Ignoriert</span>
                            } @else {
                              <span class="text-gray-400">-</span>
                            }
                          } @else {
                            <ul class="space-y-0.5">
                              @for (assignment of entry.accountAssignments; track assignment.id) {
                                <li class="text-[11px] text-gray-700">
                                  <span class="font-medium">{{ assignment.accountCode }}</span>
                                  {{ assignment.accountName }}
                                  <span class="text-gray-500">({{ formatAmount(assignment.value) }})</span>
                                </li>
                              }
                              @if (entry.assignmentStatus === 'partial') {
                                <li i18n class="text-[11px] text-gray-500 italic">Teilweise ignoriert</li>
                              }
                            </ul>
                          }
                        </td>
                        <td class="px-3 py-2 text-xs text-gray-900">
                          <app-status-badge
                            size="sm"
                            [variant]="statusVariant(entry.assignmentStatus)"
                          >
                            {{ statusLabel(entry.assignmentStatus) }}
                          </app-status-badge>
                        </td>
                        <td class="px-3 py-2 text-right text-xs">
                          <a
                            [routerLink]="['/transactions', entry.id]"
                            class="text-xs text-blue-600 hover:underline"
                          >
                            <ng-container i18n>Bearbeiten</ng-container>
                          </a>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <p i18n class="text-xs text-gray-500">
                Geladen {{ entries().length }} von {{ total() }} Einträgen
              </p>
              @if (hasMore()) {
                <app-button
                  variant="secondary"
                  [loading]="loadingMore()"
                  [disabled]="loadingMore()"
                  (clicked)="loadMore()"
                >
                  <ng-container i18n>Mehr laden</ng-container>
                </app-button>
              }
            </div>
            }
          </div>
        }
      </div>
    </div>

  `,
})
export class JournalListComponent implements OnInit {
  private readonly dataService = inject(JournalListDataService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly entries = signal<JournalEntry[]>([]);
  readonly total = signal(0);
  readonly currentPage = signal(0);
  readonly pageSize = 20;
  readonly hasMore = computed(() => this.entries().length < this.total());

  readonly breadcrumbs: BreadcrumbItem[] = [{ label: $localize`Journal` }];

  readonly filterActiveDescription = $localize`Passen Sie die Filter an oder setzen Sie sie zurück.`;
  readonly filterInactiveDescription = $localize`Importieren Sie Buchungen, um das Journal zu füllen.`;

  filterAfterDate = '';
  filterBeforeDate = '';
  filterQuery = '';
  filterAssignmentStatus: 'all' | JournalAssignmentStatus = 'all';

  ngOnInit(): void {
    this.fetchEntries(0, false);
  }

  applyFilters(): void {
    this.currentPage.set(0);
    this.fetchEntries(0, false);
  }

  resetFilters(): void {
    this.filterAfterDate = '';
    this.filterBeforeDate = '';
    this.filterQuery = '';
    this.filterAssignmentStatus = 'all';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return (
      !!this.filterAfterDate ||
      !!this.filterBeforeDate ||
      !!this.filterQuery.trim() ||
      this.filterAssignmentStatus !== 'all'
    );
  }

  loadMore(): void {
    if (!this.hasMore() || this.loadingMore()) {
      return;
    }

    this.loadingMore.set(true);
    this.fetchEntries(this.currentPage() + 1, true);
  }

  private fetchEntries(page: number, append: boolean): void {
    if (!append) {
      this.loading.set(true);
      this.entries.set([]);
    }

    this.dataService.getEntries(page, this.pageSize, this.buildFilters()).subscribe({
      next: (result) => {
        if (append) {
          this.entries.update((existing) => [...existing, ...result.entries]);
          this.loadingMore.set(false);
        } else {
          this.entries.set(result.entries);
          this.loading.set(false);
        }

        this.currentPage.set(page);
        this.total.set(result.total);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden der Buchungen`);
        if (append) {
          this.loadingMore.set(false);
        } else {
          this.loading.set(false);
        }
      },
    });
  }

  private buildFilters(): JournalEntryFilters {
    return {
      afterDate: this.filterAfterDate || undefined,
      beforeDate: this.filterBeforeDate || undefined,
      query: this.filterQuery.trim() || undefined,
      assignmentStatus: this.filterAssignmentStatus,
    };
  }

  trackById = (entry: JournalEntry) => entry.id;

  formatDate(date: Date): string {
    return formatDateShort(date);
  }

  statusLabel(status: JournalAssignmentStatus): string {
    if (status === 'assigned') {
      return $localize`Vollst. zugeordnet`;
    }

    if (status === 'partial') {
      return $localize`Teilw. zugeordnet`;
    }

    if (status === 'ignored') {
      return $localize`Ignoriert`;
    }

    return $localize`Offen`;
  }

  statusVariant(status: JournalAssignmentStatus): 'success' | 'warning' | 'neutral' {
    if (status === 'assigned') {
      return 'success';
    }

    if (status === 'partial') {
      return 'warning';
    }

    return 'neutral';
  }

  formatAmount(value: string): string {
    const num = parseFloat(value);
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(num);
  }
}
