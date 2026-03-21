import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
} from '../../../shared/components';
import { Setting } from '../../../shared/models';
import { SettingsDataService } from './settings.data-service';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeaderComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs" />

      <div class="flex flex-1 items-start justify-center overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" text="Einstellungen werden geladen..." />
        } @else {
          <div class="w-full max-w-2xl space-y-3">
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="text-sm font-semibold text-gray-900 mb-4">
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
                    <div class="flex gap-2">
                      <input
                        [id]="setting.key"
                        type="text"
                        [(ngModel)]="editValues[setting.key]"
                        class="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <app-button
                        variant="secondary"
                        size="sm"
                        [disabled]="saving() === setting.key || editValues[setting.key] === setting.value"
                        (clicked)="saveSetting(setting)"
                      >
                        {{ saving() === setting.key ? 'Speichern...' : 'Speichern' }}
                      </app-button>
                    </div>
                    <p class="text-xs text-gray-500">
                      Schlüssel: {{ setting.key }}
                    </p>
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
export class SettingsComponent implements OnInit {
  private readonly dataService = inject(SettingsDataService);

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

  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Einstellungen' }];

  ngOnInit(): void {
    this.loadSettings();
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
        this.loading.set(false);
      },
    });
  }

  saveSetting(setting: Setting): void {
    const newValue = this.editValues[setting.key];
    if (newValue === setting.value) return;

    this.saving.set(setting.key);
    this.dataService.updateSetting(setting.key, newValue).subscribe({
      next: (updated) => {
        this.settings.update((settings) =>
          settings.map((s) => (s.key === updated.key ? updated : s))
        );
        this.saving.set(null);
      },
      error: () => {
        this.saving.set(null);
      },
    });
  }
}
