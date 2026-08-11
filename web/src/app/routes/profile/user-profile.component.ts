import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LoadingSpinnerComponent,
  NotificationService,
  AdminContentHeaderComponent,
  AdminContentComponent,
} from '../../shared/components';
import { UserProfileDataService, UserProfile } from './user-profile.data-service';

@Component({
  selector: 'app-user-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    LoadingSpinnerComponent,
    AdminContentHeaderComponent,
    AdminContentComponent,
  ],
  template: `
    <div class="flex flex-col h-full min-h-0">
      <app-admin-content-header i18n-title title="Mein Profil">
      </app-admin-content-header>
      <app-admin-content>
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Profil wird geladen..." />
        } @else if (profile()) {
          <div class="w-full max-w-2xl">
            <!-- User Info -->
            <div class="bg-white rounded-lg border border-gray-200 p-6 mb-4">
              <div class="flex items-center gap-4 mb-6">
                <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <span class="text-xl font-medium text-gray-500">
                    {{ getInitials(profile()!.name) }}
                  </span>
                </div>
                <div>
                  <h2 class="text-lg font-semibold text-gray-900">{{ profile()!.name }}</h2>
                  <p class="text-sm text-gray-500">{{ profile()!.email }}</p>
                </div>
              </div>

              <dl class="space-y-3">
                <div>
                  <dt i18n class="text-xs text-gray-500">Name</dt>
                  <dd class="text-sm text-gray-900">{{ profile()!.name }}</dd>
                </div>
                <div>
                  <dt i18n class="text-xs text-gray-500">E-Mail</dt>
                  <dd class="text-sm text-gray-900">{{ profile()!.email }}</dd>
                </div>
              </dl>
            </div>

            <!-- Settings -->
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <h3 i18n class="text-sm font-semibold text-gray-900 mb-4">
                Einstellungen
              </h3>

              <div class="space-y-4">
                <!-- Locale -->
                <div>
                  <label for="locale" i18n class="block text-xs font-medium text-gray-700 mb-1">
                    Sprache
                  </label>
                  <select
                    id="locale"
                    [(ngModel)]="editLocale"
                    (ngModelChange)="markDirty()"
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="de-DE">Deutsch</option>
                    <option value="en-US">English</option>
                  </select>
                </div>

                <!-- Theme -->
                <div>
                  <label for="theme" i18n class="block text-xs font-medium text-gray-700 mb-1">
                    Design
                  </label>
                  <select
                    id="theme"
                    [(ngModel)]="editTheme"
                    (ngModelChange)="markDirty()"
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="system" i18n>System</option>
                    <option value="light" i18n>Hell</option>
                    <option value="dark" i18n>Dunkel</option>
                  </select>
                </div>

                <!-- Email Notifications -->
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    [(ngModel)]="editEmailNotifications"
                    (ngModelChange)="markDirty()"
                    class="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label for="emailNotifications" i18n class="text-sm text-gray-900">
                    E-Mail-Benachrichtigungen erhalten
                  </label>
                </div>

                <!-- Save Button -->
                <div class="pt-2">
                  <button
                    type="button"
                    (click)="save()"
                    [disabled]="!dirty() || saving()"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    @if (saving()) {
                      <ng-container i18n>Speichern...</ng-container>
                    } @else {
                      <ng-container i18n>Speichern</ng-container>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </app-admin-content>
    </div>
  `,
})
export class UserProfileComponent implements OnInit {
  private readonly dataService = inject(UserProfileDataService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly dirty = signal(false);
  readonly profile = signal<UserProfile | null>(null);

  editLocale = 'de-DE';
  editTheme = 'system';
  editEmailNotifications = false;

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.dataService.getUserProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.editLocale = profile.locale || 'de-DE';
        this.editTheme = profile.theme || 'system';
        this.editEmailNotifications = profile.emailNotifications;
        this.dirty.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden des Profils`);
        this.loading.set(false);
      },
    });
  }

  markDirty(): void {
    this.dirty.set(true);
  }

  save(): void {
    this.saving.set(true);
    this.dataService.updateSettings({
      locale: this.editLocale,
      theme: this.editTheme,
      emailNotifications: this.editEmailNotifications,
    }).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.dirty.set(false);
        this.saving.set(false);
        this.notifications.success($localize`Einstellungen gespeichert`);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Speichern der Einstellungen`);
        this.saving.set(false);
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
