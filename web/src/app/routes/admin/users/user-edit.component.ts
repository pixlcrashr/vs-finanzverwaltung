import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  LoadingSpinnerComponent,
  NotificationService,
  AdminContentHeaderComponent,
  AdminContentComponent,
} from '../../../shared/components';
import { User, UserGroup } from '../../../shared/models';
import { UserEditDataService } from './user-edit.data-service';

@Component({
  selector: 'app-user-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LoadingSpinnerComponent,
    AdminContentHeaderComponent,
    AdminContentComponent,
  ],
  template: `
    <div class="flex flex-col h-full min-h-0">
      <app-admin-content-header i18n-title title="Benutzer bearbeiten">
      </app-admin-content-header>
      <app-admin-content>
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
                  <div class="flex items-center justify-between mb-4">
                    <h3 i18n class="text-sm font-semibold text-gray-900">
                      Gruppenzugehörigkeit
                    </h3>
                    @if (savingGroup()) {
                      <span class="text-xs text-gray-500 flex items-center gap-1">
                        <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <ng-container i18n>Speichern...</ng-container>
                      </span>
                    }
                  </div>

                  <div class="space-y-1">
                    @for (group of allGroups(); track group.id) {
                      <label
                        class="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          [checked]="isGroupAssigned(group.id)"
                          (change)="toggleGroup(group, $event)"
                          class="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span class="text-sm text-gray-900">{{ group.name }}</span>
                      </label>
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
      </app-admin-content>
    </div>
  `,
})
export class UserEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(UserEditDataService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  private readonly pendingGroupSaves = signal(0);
  readonly savingGroup = computed(() => this.pendingGroupSaves() > 0);
  readonly user = signal<User | null>(null);
  readonly allGroups = signal<UserGroup[]>([]);

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
        this.loadAllGroups();
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden des Benutzers`);
        this.loading.set(false);
      },
    });
  }

  private loadAllGroups(): void {
    this.dataService.getAvailableGroups().subscribe({
      next: (groups) => {
        this.allGroups.set(groups);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden der Gruppen`);
        this.loading.set(false);
      },
    });
  }

  isGroupAssigned(groupId: string): boolean {
    return this.user()?.groups.some((g) => g.id === groupId) ?? false;
  }

  toggleGroup(group: UserGroup, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    // Optimistic update
    this.user.update((u) => {
      if (!u) return u;
      if (checked) {
        return { ...u, groups: [...u.groups, group] };
      } else {
        return { ...u, groups: u.groups.filter((g) => g.id !== group.id) };
      }
    });

    this.pendingGroupSaves.update(n => n + 1);
    const request$ = checked
      ? this.dataService.addUserToGroup(this.userId, group.id)
      : this.dataService.removeUserFromGroup(this.userId, group.id);

    request$.subscribe({
      next: () => this.pendingGroupSaves.update(n => n - 1),
      error: () => {
        this.notifications.error(
          checked
            ? $localize`Fehler beim Hinzufügen zur Gruppe`
            : $localize`Fehler beim Entfernen aus der Gruppe`
        );
        // Revert optimistic update
        this.user.update((u) => {
          if (!u) return u;
          if (checked) {
            return { ...u, groups: u.groups.filter((g) => g.id !== group.id) };
          } else {
            return { ...u, groups: [...u.groups, group] };
          }
        });
        this.pendingGroupSaves.update(n => n - 1);
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
