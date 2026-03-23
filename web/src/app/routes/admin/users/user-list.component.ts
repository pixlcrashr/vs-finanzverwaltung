import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  LoadingSpinnerComponent,
  EmptyStateComponent,
} from '../../../shared/components';
import { User } from '../../../shared/models';
import { UserListDataService } from './user-list.data-service';

@Component({
  selector: 'app-user-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageHeaderComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs" />

      <div class="flex flex-1 justify-center overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" text="Benutzer werden geladen..." />
        } @else if (users().length === 0) {
          <app-empty-state
            title="Keine Benutzer vorhanden"
            description="Es wurden noch keine Benutzer registriert."
          />
        } @else {
          <div class="w-full max-w-3xl">
            <div class="bg-white rounded-lg border border-gray-200">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        E-Mail
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        Gruppen
                      </th>
                      <th scope="col" class="px-3 py-2 text-right">
                        <span class="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    @for (user of users(); track user.id) {
                      <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-3 py-2 text-xs text-gray-900">{{ user.name }}</td>
                        <td class="px-3 py-2 text-xs text-gray-900">{{ user.email }}</td>
                        <td class="px-3 py-2 text-xs text-gray-900">
                          @if (user.groups.length === 0) {
                            <span class="text-gray-500">-</span>
                          } @else {
                            {{ user.groups.map((g) => g.name).join(', ') }}
                          }
                        </td>
                        <td class="px-3 py-2 text-right text-xs">
                          <a
                            [routerLink]="['/admin/users', user.id, 'edit']"
                            class="text-xs text-blue-600 hover:underline"
                          >
                            Bearbeiten
                          </a>
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
    </div>
  `,
})
export class UserListComponent implements OnInit {
  private readonly dataService = inject(UserListDataService);

  readonly loading = signal(true);
  readonly users = signal<User[]>([]);

  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Benutzer' }];

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.dataService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
