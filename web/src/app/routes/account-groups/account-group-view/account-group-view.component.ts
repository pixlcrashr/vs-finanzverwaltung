import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  LoadingSpinnerComponent,
} from '../../../shared/components';
import { AccountGroupStats, AccountGroupAssignment } from '../../../shared/models';
import { AccountGroupViewDataService } from './account-group-view.data-service';

@Component({
  selector: 'app-account-group-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageHeaderComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs()">
        <a
          [routerLink]="['/account-groups', group()?.id, 'edit']"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:opacity-90"
        >
          Bearbeiten
        </a>
      </app-page-header>

      <div class="flex-1 overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" text="Kontengruppe wird geladen..." />
        } @else if (group()) {
          <div class="max-w-4xl space-y-3">
            <!-- Overview Card -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="text-sm font-semibold text-gray-900 mb-4">
                {{ group()!.name }}
              </h2>

              <div class="grid grid-cols-3 gap-2">
                <div class="bg-gray-50 rounded-lg p-4">
                  <p class="text-xs text-gray-500">Zugeordnete Konten</p>
                  <p class="text-2xl font-semibold text-gray-900">
                    {{ group()!.accounts.length }}
                  </p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <p class="text-xs text-gray-500">Gesamtwert</p>
                  <p class="text-2xl font-semibold text-gray-900">
                    {{ formatCurrency(group()!.totalValue) }}
                  </p>
                </div>
                <div class="bg-gray-50 rounded-lg p-4">
                  <p class="text-xs text-gray-500">Transaktionen</p>
                  <p class="text-2xl font-semibold text-gray-900">
                    {{ group()!.transactionCount }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Assigned Accounts -->
            <div class="bg-white rounded-lg border border-gray-200">
              <div class="p-4 border-b border-gray-200">
                <h3 class="text-sm font-semibold text-gray-900">
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
                        Kontonummer
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        Kontoname
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    @for (assignment of group()!.accounts; track trackById(assignment)) {
                      <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-3 py-2 text-xs text-gray-900">{{ assignment.accountCode }}</td>
                        <td class="px-3 py-2 text-xs text-gray-900">{{ assignment.accountName }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AccountGroupViewComponent implements OnInit {
  private readonly dataService = inject(AccountGroupViewDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly group = signal<AccountGroupStats | null>(null);

  readonly breadcrumbs = signal<BreadcrumbItem[]>([
    { label: 'Kontengruppen', path: '/account-groups' },
    { label: 'Laden...' },
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
          { label: 'Kontengruppen', path: '/account-groups' },
          { label: group.name },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/account-groups']);
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
}
