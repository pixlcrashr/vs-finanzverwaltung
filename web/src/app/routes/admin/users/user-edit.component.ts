import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
} from '../../../shared/components';
import { User, UserGroup } from '../../../shared/models';
import { UserEditDataService } from './user-edit.data-service';

@Component({
  selector: 'app-user-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs">
        <app-button variant="secondary" (clicked)="cancel()">
          Zurück
        </app-button>
      </app-page-header>

      <div class="flex flex-1 justify-center overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" text="Benutzer wird geladen..." />
        } @else if (user()) {
          <div class="w-full max-w-2xl space-y-3">
            <!-- User Info -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  @if (user()!.image) {
                    <img [src]="user()!.image" [alt]="user()!.name" class="w-full h-full object-cover" />
                  } @else {
                    <span class="text-xl font-medium text-gray-500">
                      {{ getInitials(user()!.name) }}
                    </span>
                  }
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900">
                    {{ user()!.name }}
                  </h2>
                  <p class="text-sm text-gray-500">
                    {{ user()!.email }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Group Management -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h3 class="text-sm font-semibold text-gray-900 mb-4">
                Gruppenzugehörigkeit
              </h3>

              <!-- Current Groups -->
              <div class="mb-4">
                <h4 class="text-xs font-medium text-gray-500 mb-2">
                  Aktuelle Gruppen
                </h4>
                @if (user()!.groups.length === 0) {
                  <p class="text-xs text-gray-500">
                    Keine Gruppen zugewiesen
                  </p>
                } @else {
                  <div class="space-y-2">
                    @for (group of user()!.groups; track group.id) {
                      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span class="text-sm text-gray-900">{{ group.name }}</span>
                          @if (group.description) {
                            <p class="text-xs text-gray-500">
                              {{ group.description }}
                            </p>
                          }
                        </div>
                        <app-button
                          variant="danger"
                          [disabled]="removingGroup() === group.id"
                          (clicked)="removeFromGroup(group)"
                        >
                          {{ removingGroup() === group.id ? 'Entfernen...' : 'Entfernen' }}
                        </app-button>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Add to Group -->
              <div>
                <h4 class="text-xs font-medium text-gray-500 mb-2">
                  Zu Gruppe hinzufügen
                </h4>
                @if (availableGroups().length === 0) {
                  <p class="text-xs text-gray-500">
                    Der Benutzer ist bereits allen Gruppen zugewiesen
                  </p>
                } @else {
                  <div class="space-y-2">
                    @for (group of availableGroups(); track group.id) {
                      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span class="text-sm text-gray-900">{{ group.name }}</span>
                          @if (group.description) {
                            <p class="text-xs text-gray-500">
                              {{ group.description }}
                            </p>
                          }
                        </div>
                        <app-button
                          variant="primary"
                          [disabled]="addingGroup() === group.id"
                          (clicked)="addToGroup(group)"
                        >
                          {{ addingGroup() === group.id ? 'Hinzufügen...' : 'Hinzufügen' }}
                        </app-button>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class UserEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dataService = inject(UserEditDataService);

  readonly loading = signal(true);
  readonly addingGroup = signal<string | null>(null);
  readonly removingGroup = signal<string | null>(null);
  readonly user = signal<User | null>(null);
  readonly availableGroups = signal<UserGroup[]>([]);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Benutzer', path: '/admin/users' },
    { label: 'Bearbeiten' },
  ];

  private userId = '';

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.loadUser();
    }
  }

  private loadUser(): void {
    this.dataService.getUser(this.userId).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loadAvailableGroups();
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private loadAvailableGroups(): void {
    this.dataService.getAvailableGroups().subscribe({
      next: (groups) => {
        this.availableGroups.set(groups);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  addToGroup(group: UserGroup): void {
    this.addingGroup.set(group.id);
    this.dataService.addUserToGroup(this.userId, group.id).subscribe({
      next: () => {
        this.user.update((u) => {
          if (!u) return u;
          return { ...u, groups: [...u.groups, group] };
        });
        this.availableGroups.update((groups) =>
          groups.filter((g) => g.id !== group.id)
        );
        this.addingGroup.set(null);
      },
      error: () => {
        this.addingGroup.set(null);
      },
    });
  }

  removeFromGroup(group: UserGroup): void {
    this.removingGroup.set(group.id);
    this.dataService.removeUserFromGroup(this.userId, group.id).subscribe({
      next: () => {
        this.user.update((u) => {
          if (!u) return u;
          return { ...u, groups: u.groups.filter((g) => g.id !== group.id) };
        });
        this.availableGroups.update((groups) => [...groups, group]);
        this.removingGroup.set(null);
      },
      error: () => {
        this.removingGroup.set(null);
      },
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  cancel(): void {
    this.router.navigate(['/admin/users']);
  }
}
