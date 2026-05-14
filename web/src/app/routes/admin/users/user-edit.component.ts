import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  PageContentLayoutComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
  NotificationService,
} from '../../../shared/components';
import { User, UserGroup } from '../../../shared/models';
import { UserEditDataService } from './user-edit.data-service';

@Component({
  selector: 'app-user-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageContentLayoutComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs">
      <div layout-content class="flex flex-1 justify-center">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Benutzer wird geladen..." />
        } @else if (user()) {
          <div class="w-full max-w-4xl">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <!-- Left Column: User Info & Group Management -->
              <div class="lg:col-span-2 space-y-4">
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
                  <h3 i18n class="text-sm font-semibold text-gray-900 mb-4">
                    Gruppenzugehörigkeit
                  </h3>

                  <!-- Current Groups -->
                  <div class="mb-4">
                    <h4 i18n class="text-xs font-medium text-gray-500 mb-2">
                      Aktuelle Gruppen
                    </h4>
                    @if (user()!.groups.length === 0) {
                      <p i18n class="text-xs text-gray-500">
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
                              size="sm"
                              [disabled]="removingGroup() === group.id"
                              (clicked)="removeFromGroup(group)"
                            >
                              <ng-container i18n>{{ removingGroup() === group.id ? 'Entfernen...' : 'Entfernen' }}</ng-container>
                            </app-button>
                          </div>
                        }
                      </div>
                    }
                  </div>

                  <!-- Add to Group -->
                  <div>
                    <h4 i18n class="text-xs font-medium text-gray-500 mb-2">
                      Zu Gruppe hinzufügen
                    </h4>
                    @if (availableGroups().length === 0) {
                      <p i18n class="text-xs text-gray-500">
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
                              size="sm"
                              [disabled]="addingGroup() === group.id"
                              (clicked)="addToGroup(group)"
                            >
                              <ng-container i18n>{{ addingGroup() === group.id ? 'Hinzufügen...' : 'Hinzufügen' }}</ng-container>
                            </app-button>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Right Column: Info & Actions -->
              <div class="space-y-4">
                <!-- Info Card -->
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 i18n class="text-xs font-semibold text-gray-500 uppercase mb-3">Informationen</h3>
                  <dl class="space-y-3">
                    <div>
                      <dt i18n class="text-xs text-gray-500">E-Mail</dt>
                      <dd class="text-sm text-gray-900">{{ user()!.email }}</dd>
                    </div>
                    <div>
                      <dt i18n class="text-xs text-gray-500">Gruppen</dt>
                      <dd class="text-sm text-gray-900">{{ user()!.groups.length }}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </app-page-content-layout>
  `,
})
export class UserEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(UserEditDataService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly addingGroup = signal<string | null>(null);
  readonly removingGroup = signal<string | null>(null);
  readonly user = signal<User | null>(null);
  readonly availableGroups = signal<UserGroup[]>([]);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: $localize`Benutzer`, path: '/admin/users' },
    { label: $localize`Bearbeiten` },
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
        this.notifications.error($localize`Fehler beim Laden des Benutzers`);
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
        this.notifications.error($localize`Fehler beim Laden der verfügbaren Gruppen`);
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
        this.notifications.error($localize`Fehler beim Hinzufügen zur Gruppe`);
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
        this.notifications.error($localize`Fehler beim Entfernen aus der Gruppe`);
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
}
