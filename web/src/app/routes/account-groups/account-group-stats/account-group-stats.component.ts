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
import { AccountGroupStats, AccountGroupAssignment, AccountGroupOperation } from '../../../shared/models';
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
      <a
        layout-header-actions
        [routerLink]="['/accountGroups', group()?.id]"
        class="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:opacity-90"
      >
        <ng-container i18n>Bearbeiten</ng-container>
      </a>

      <div layout-content class="flex flex-1 justify-center">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Statistik wird geladen..." />
        } @else if (group()) {
          <div class="w-full max-w-4xl space-y-3">
            <!-- Overview Card -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="text-sm font-semibold text-gray-900 mb-4">
                {{ group()!.name }}
              </h2>

              <div class="grid grid-cols-3 gap-2">
                <div class="bg-gray-50 rounded-lg p-4 text-center">
                  <p i18n class="text-xs text-gray-500">Zugeordnete Konten</p>
                  <p class="text-2xl font-semibold text-gray-900">
                    {{ group()!.accounts.length }}
                  </p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 text-center">
                  <p i18n class="text-xs text-gray-500">Gesamtwert</p>
                  <p class="text-2xl font-semibold text-gray-900">
                    {{ formatCurrency(group()!.totalValue) }}
                  </p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4 text-center">
                  <p i18n class="text-xs text-gray-500">Transaktionen</p>
                  <p class="text-2xl font-semibold text-gray-900">
                    {{ group()!.transactionCount }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Assigned Accounts -->
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
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        <ng-container i18n>Kontonummer</ng-container>
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        <ng-container i18n>Kontoname</ng-container>
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-center text-gray-500"
                      >
                        <ng-container i18n>Operation</ng-container>
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
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
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
  readonly group = signal<AccountGroupStats | null>(null);

  readonly breadcrumbs = signal<BreadcrumbItem[]>([
    { label: $localize`Kontengruppen`, path: '/accountGroups' },
    { label: $localize`Laden...` },
  ]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadGroup(id);
    }
  }

  private loadGroup(id: string): void {
    this.dataService.getGroup(id).subscribe({
      next: (group) => {
        this.group.set(group);
        this.breadcrumbs.set([
          { label: $localize`Kontengruppen`, path: '/accountGroups' },
          { label: group.name, path: `/accountGroups/${group.id}` },
          { label: $localize`Statistik` },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.error($localize`Fehler beim Laden der Statistik`);
        this.router.navigate(['/accountGroups']);
      },
    });
  }

  trackById = (item: AccountGroupAssignment) => item.id;

  formatCurrency(value: string): string {
    const num = parseFloat(value);
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(num);
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
