import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  PageContentLayoutComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
  NotificationService,
} from '../../shared/components';
import {
  OrganizationSettingsDataService,
  OrganizationSettings,
} from './organization-settings.data-service';
import { HasPermissionPipe } from '../../../lib/authz/has-permission.pipe';
import { Permission, Permissions } from '../../../lib/authz/permissions';

@Component({
  selector: 'app-organization-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, PageContentLayoutComponent, ButtonComponent, LoadingSpinnerComponent, HasPermissionPipe],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs">
      <div layout-content>
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Einstellungen werden geladen..." />
        } @else if (settings()) {
          <div class="max-w-2xl mx-auto">
            <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
              <!-- Organization Name -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <ng-container i18n>Organisationsname</ng-container>
                </label>
                <input
                  type="text"
                  [(ngModel)]="name"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Description -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <ng-container i18n>Beschreibung</ng-container>
                </label>
                <textarea
                  [(ngModel)]="description"
                  rows="3"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <!-- Fiscal Year Start -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <ng-container i18n>Geschäftsjahr Beginn (Monat)</ng-container>
                </label>
                <select
                  [(ngModel)]="fiscalYearStart"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option [ngValue]="1" i18n>Januar</option>
                  <option [ngValue]="2" i18n>Februar</option>
                  <option [ngValue]="3" i18n>März</option>
                  <option [ngValue]="4" i18n>April</option>
                  <option [ngValue]="5" i18n>Mai</option>
                  <option [ngValue]="6" i18n>Juni</option>
                  <option [ngValue]="7" i18n>Juli</option>
                  <option [ngValue]="8" i18n>August</option>
                  <option [ngValue]="9" i18n>September</option>
                  <option [ngValue]="10" i18n>Oktober</option>
                  <option [ngValue]="11" i18n>November</option>
                  <option [ngValue]="12" i18n>Dezember</option>
                </select>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1" i18n>
                  Das Geschäftsjahr endet am letzten Tag des Vormonats des Startmonats im Folgejahr.
                </p>
              </div>

              <!-- Actions -->
              <div class="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                @if (Permissions.SETTINGS_UPDATE | hasPermission) {
                  <app-button
                    [disabled]="saving()"
                    [loading]="saving()"
                    (clicked)="save()"
                  >
                    <ng-container i18n>Speichern</ng-container>
                  </app-button>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </app-page-content-layout>
  `,
})
export class OrganizationSettingsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(OrganizationSettingsDataService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly settings = signal<OrganizationSettings | null>(null);
  readonly Permissions = Permissions;

  name = '';
  description = '';
  fiscalYearStart = 1;

  readonly orgId = signal<string>('');

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: $localize`Einstellungen` }
  ];

  ngOnInit(): void {
    const orgId = this.route.snapshot.paramMap.get('orgId');
    if (orgId) {
      this.orgId.set(orgId);
      this.loadSettings(orgId);
    }
  }

  private loadSettings(orgId: string): void {
    this.loading.set(true);
    this.dataService.getSettings(orgId).subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.name = settings.name;
        this.description = settings.description || '';
        this.fiscalYearStart = settings.fiscalYearStart;
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden der Einstellungen`);
        this.loading.set(false);
      },
    });
  }

  save(): void {
    const orgId = this.orgId();
    if (!orgId) return;

    this.saving.set(true);

    const update: Partial<OrganizationSettings> = {
      name: this.name,
      description: this.description || undefined,
      fiscalYearStart: this.fiscalYearStart,
    };

    this.dataService.updateSettings(orgId, update).subscribe({
      next: () => {
        this.notifications.success($localize`Einstellungen erfolgreich aktualisiert`);
        this.saving.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Speichern der Einstellungen`);
        this.saving.set(false);
      },
    });
  }
}
