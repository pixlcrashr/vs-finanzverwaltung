import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  PageContentLayoutComponent,
  BreadcrumbItem,
  LoadingSpinnerComponent,
  NotificationService,
} from '../../../shared/components';
import { AccountGroupStats, AccountGroupAssignment, AccountGroupOperation, Budget, BudgetTag } from '../../../shared/models';
import { AccountGroupStatsDataService } from './account-group-stats.data-service';

@Component({
  selector: 'app-account-group-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageContentLayoutComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs()">
      <div layout-content class="flex flex-1 justify-center">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Statistik wird geladen..." />
        } @else if (group()) {
          <div class="w-full max-w-4xl space-y-3">
            <!-- Budget & Tag Selection -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <div class="flex flex-wrap items-end gap-4">
                <div class="flex-1 min-w-[180px]">
                  <label i18n for="budget-select" class="block text-xs font-medium text-gray-700 mb-1">
                    Haushaltsplan
                  </label>
                  <select
                    id="budget-select"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    [value]="selectedBudgetId()"
                    (change)="onBudgetChange($event)"
                  >
                    @for (budget of budgets(); track budget.id) {
                      <option [value]="budget.id">{{ budget.displayName }}</option>
                    }
                  </select>
                </div>
                <div class="flex-1 min-w-[180px]">
                  <label i18n for="tag-select" class="block text-xs font-medium text-gray-700 mb-1">
                    Tag
                  </label>
                  <select
                    id="tag-select"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    [value]="selectedTagId()"
                    (change)="onTagChange($event)"
                  >
                    <option value="" i18n>Aktuell (ohne Tag)</option>
                    @for (tag of tags(); track tag.id) {
                      <option [value]="tag.id">{{ tag.name }}</option>
                    }
                  </select>
                </div>
              </div>
            </div>

            <!-- Overview Card -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="text-sm font-semibold text-gray-900 mb-4">
                {{ group()!.name }}
              </h2>

              @if (loadingStats()) {
                <div class="flex justify-center py-6">
                  <app-loading-spinner i18n-text text="Werte werden geladen..." />
                </div>
              } @else {
                <div class="grid grid-cols-4 gap-2">
                  <div class="bg-gray-50 rounded-lg p-4 text-center">
                    <p i18n class="text-xs text-gray-500">Zugeordnete Konten</p>
                    <p class="text-2xl font-semibold text-gray-900">
                      {{ group()!.accounts.length }}
                    </p>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-4 text-center">
                    <p i18n class="text-xs text-gray-500">Soll</p>
                    <p class="text-2xl font-semibold text-gray-900">
                      {{ formatCurrency(group()!.targetValue) }}
                    </p>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-4 text-center">
                    <p i18n class="text-xs text-gray-500">Ist</p>
                    <p class="text-2xl font-semibold text-gray-900">
                      {{ formatCurrency(group()!.actualValue) }}
                    </p>
                  </div>
                  <div class="bg-gray-50 rounded-lg p-4 text-center">
                    <p i18n class="text-xs text-gray-500">Differenz</p>
                    <p class="text-2xl font-semibold" [class]="getDiffClass(group()!.targetValue, group()!.actualValue)">
                      {{ formatCurrency(getDiff(group()!.targetValue, group()!.actualValue)) }}
                    </p>
                  </div>
                </div>
              }
            </div>

            <!-- Assigned Accounts -->
            @if (!loadingStats()) {
              <div class="bg-white rounded-lg border border-gray-200">
                <div class="p-4 border-b border-gray-200">
                  <h3 i18n class="text-sm font-semibold text-gray-900">
                    Zugeordnete Konten
                  </h3>
                </div>
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th scope="col" class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500">
                          <ng-container i18n>Kontonummer</ng-container>
                        </th>
                        <th scope="col" class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500">
                          <ng-container i18n>Kontoname</ng-container>
                        </th>
                        <th scope="col" class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-center text-gray-500">
                          <ng-container i18n>Operation</ng-container>
                        </th>
                        <th scope="col" class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-right text-gray-500">
                          <ng-container i18n>Soll</ng-container>
                        </th>
                        <th scope="col" class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-right text-gray-500">
                          <ng-container i18n>Ist</ng-container>
                        </th>
                        <th scope="col" class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-right text-gray-500">
                          <ng-container i18n>Differenz</ng-container>
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 bg-white">
                      @for (assignment of group()!.accounts; track trackById(assignment)) {
                        <tr class="hover:bg-gray-50 transition-colors">
                          <td class="px-3 py-2 text-xs text-gray-900">{{ assignment.accountCode }}</td>
                          <td class="px-3 py-2 text-xs text-gray-900">{{ assignment.accountName }}</td>
                          <td class="px-3 py-2 text-center">
                            <span class="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded" [class]="getOperationBadgeClass(assignment.operation)">
                              {{ assignment.operation }}
                            </span>
                          </td>
                          <td class="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">{{ formatCurrency(assignment.targetValue) }}</td>
                          <td class="px-3 py-2 text-xs text-gray-900 text-right whitespace-nowrap">{{ formatCurrency(assignment.actualValue) }}</td>
                          <td class="px-3 py-2 text-xs text-right whitespace-nowrap" [class]="getDiffClass(assignment.targetValue, assignment.actualValue)">
                            {{ formatCurrency(getDiff(assignment.targetValue, assignment.actualValue)) }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </app-page-content-layout>
  `,
})
export class AccountGroupStatsComponent implements OnInit {
  private readonly dataService = inject(AccountGroupStatsDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly loadingStats = signal(false);
  readonly group = signal<AccountGroupStats | null>(null);
  readonly budgets = signal<Budget[]>([]);
  readonly tags = signal<BudgetTag[]>([]);
  readonly selectedBudgetId = signal('');
  readonly selectedTagId = signal('');

  readonly breadcrumbs = signal<BreadcrumbItem[]>([
    { label: $localize`Kontengruppen`, path: '/accountGroups' },
    { label: $localize`Laden...` },
  ]);

  private groupId = '';

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id') || '';
    if (this.groupId) {
      this.loadBudgets();
    }
  }

  private loadBudgets(): void {
    this.dataService.getBudgets().subscribe({
      next: (budgets) => {
        this.budgets.set(budgets);
        if (budgets.length > 0) {
          this.selectedBudgetId.set(budgets[0].id);
          this.loadTags(budgets[0].id);
          this.loadStats();
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
        this.notifications.error($localize`Fehler beim Laden der Haushaltspläne`);
        this.router.navigate(['/accountGroups']);
      },
    });
  }

  private loadTags(budgetId: string): void {
    this.dataService.getBudgetTags(budgetId).subscribe({
      next: (tags) => this.tags.set(tags),
      error: () => this.tags.set([]),
    });
  }

  private loadStats(): void {
    this.loadingStats.set(true);
    const budgetId = this.selectedBudgetId();
    const tagId = this.selectedTagId();

    const request$ = tagId
      ? this.dataService.getGroupStatsByTag(this.groupId, budgetId, tagId)
      : this.dataService.getGroupStats(this.groupId, budgetId);

    request$.subscribe({
      next: (stats) => {
        this.group.set(stats);
        this.breadcrumbs.set([
          { label: $localize`Kontengruppen`, path: '/accountGroups' },
          { label: stats.name, path: `/accountGroups/${stats.id}` },
          { label: $localize`Statistik` },
        ]);
        this.loading.set(false);
        this.loadingStats.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadingStats.set(false);
        this.notifications.error($localize`Fehler beim Laden der Statistik`);
      },
    });
  }

  onBudgetChange(event: Event): void {
    const budgetId = (event.target as HTMLSelectElement).value;
    this.selectedBudgetId.set(budgetId);
    this.selectedTagId.set('');
    this.loadTags(budgetId);
    this.loadStats();
  }

  onTagChange(event: Event): void {
    const tagId = (event.target as HTMLSelectElement).value;
    this.selectedTagId.set(tagId);
    this.loadStats();
  }

  trackById = (item: AccountGroupAssignment) => item.id;

  formatCurrency(value: string): string {
    const num = parseFloat(value);
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(num);
  }

  getDiff(targetValue: string, actualValue: string): string {
    return (parseFloat(actualValue) - parseFloat(targetValue)).toFixed(2);
  }

  getDiffClass(targetValue: string, actualValue: string): string {
    const diff = parseFloat(actualValue) - parseFloat(targetValue);
    if (diff > 0) return 'text-green-600';
    if (diff < 0) return 'text-red-600';
    return 'text-gray-900';
  }

  getOperationBadgeClass(operation: AccountGroupOperation): string {
    switch (operation) {
      case 'A':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'S':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'I':
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  }
}
