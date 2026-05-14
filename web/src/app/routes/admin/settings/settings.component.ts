import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import {
  PageContentLayoutComponent,
  BreadcrumbItem,
  LoadingSpinnerComponent,
  NotificationService,
} from '../../../shared/components';
import { Setting } from '../../../shared/models';
import { SettingsDataService } from './settings.data-service';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageContentLayoutComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs">
      <div layout-content class="flex flex-1 items-start justify-center">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Einstellungen werden geladen..." />
        } @else {
          <div class="w-full max-w-2xl space-y-3">
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 i18n class="text-sm font-semibold text-gray-900 mb-4">
                Systemeinstellungen
              </h2>

              <div class="space-y-4">
                @for (setting of settings(); track setting.key) {
                  <div class="space-y-1">
                    <label
                      [for]="setting.key"
                      class="block text-xs font-medium text-gray-900"
                    >
                      {{ setting.description }}
                    </label>
                    <div class="relative">
                      <input
                        [id]="setting.key"
                        type="text"
                        [(ngModel)]="editValues[setting.key]"
                        (ngModelChange)="onSettingChange(setting.key, $event)"
                        class="w-full px-2 py-1.5 pr-8 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      @if (saving() === setting.key) {
                        <div class="absolute right-2 top-1/2 -translate-y-1/2">
                          <svg class="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </app-page-content-layout>
  `,
})
export class SettingsComponent implements OnInit, OnDestroy {
  private readonly dataService = inject(SettingsDataService);
  private readonly notifications = inject(NotificationService);
  private readonly destroy$ = new Subject<void>();
  private readonly settingChange$ = new Subject<{ key: string; value: string }>();

  private readonly hiddenSettingKeys = new Set([
    'default_currency',
    'report_footer',
    'email_notifications',
    'fiscal_year_start',
  ]);

  readonly loading = signal(true);
  readonly saving = signal<string | null>(null);
  readonly settings = signal<Setting[]>([]);

  editValues: Record<string, string> = {};

  readonly breadcrumbs: BreadcrumbItem[] = [{ label: $localize`Einstellungen` }];

  ngOnInit(): void {
    this.loadSettings();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAutoSave(): void {
    this.settingChange$
      .pipe(
        debounceTime(500),
        distinctUntilChanged((a, b) => a.key === b.key && a.value === b.value),
        takeUntil(this.destroy$)
      )
      .subscribe(({ key, value }) => {
        const setting = this.settings().find((s) => s.key === key);
        if (setting && value !== setting.value) {
          this.saveSettingInternal(key, value);
        }
      });
  }

  onSettingChange(key: string, value: string): void {
    this.settingChange$.next({ key, value });
  }

  private loadSettings(): void {
    this.dataService.getSettings().subscribe({
      next: (settings) => {
        const visibleSettings = settings.filter((setting) => !this.hiddenSettingKeys.has(setting.key));
        this.settings.set(visibleSettings);
        this.editValues = {};
        visibleSettings.forEach((s) => {
          this.editValues[s.key] = s.value;
        });
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden der Einstellungen`);
        this.loading.set(false);
      },
    });
  }

  private saveSettingInternal(key: string, value: string): void {
    this.saving.set(key);
    this.dataService.updateSetting(key, value).subscribe({
      next: (updated) => {
        this.settings.update((settings) =>
          settings.map((s) => (s.key === updated.key ? updated : s))
        );
        this.saving.set(null);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Speichern der Einstellung`);
        this.saving.set(null);
      },
    });
  }
}
