import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  PageContentLayoutComponent,
  BreadcrumbItem,
  LoadingSpinnerComponent,
  EmptyStateComponent,
  StatusBadgeComponent,
  NotificationService,
} from '../../../shared/components';
import { formatDateShort } from '../../../shared/utils';
import { ImportSource } from '../../../shared/models';
import { ImportSourceListDataService } from './import-source-list.data-service';

@Component({
  selector: 'app-import-source-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageContentLayoutComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    StatusBadgeComponent,
  ],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs">
      <div layout-content class="flex flex-1 justify-center">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Importquellen werden geladen..." />
        } @else if (importSources().length === 0) {
          <app-empty-state
            i18n-title title="Keine Importquellen vorhanden"
            i18n-description description="Es wurden noch keine Importquellen konfiguriert."
          />
        } @else {
          <div class="w-full max-w-3xl space-y-2">
            @for (source of importSources(); track source.id) {
              <div class="bg-white rounded-lg border border-gray-200 p-4">
                <div class="flex items-start justify-between mb-4">
                  <div>
                    <h3 class="text-sm font-medium text-gray-900">
                      {{ source.name }}
                    </h3>
                    <p class="text-xs text-gray-500">
                      {{ source.description }}
                    </p>
                    <p i18n class="text-xs text-gray-500 mt-1">
                      Erfassung seit: {{ formatDate(source.periodStart) }}
                    </p>
                  </div>
                  <a
                    [routerLink]="['/admin/importSources', source.id, 'edit']"
                    class="text-xs text-blue-600 hover:underline"
                  >
                    <ng-container i18n>Bearbeiten</ng-container>
                  </a>
                </div>

                <!-- Periods -->
                <div class="border-t border-gray-200 pt-3">
                  <div class="flex flex-wrap gap-2">
                    @for (period of source.periods; track period.id) {
                      <div class="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded">
                        <span class="text-sm text-gray-900">{{ period.year }}</span>
                        <app-status-badge [variant]="period.isClosed ? 'neutral' : 'success'" size="sm">
                          <ng-container i18n>{{ period.isClosed ? 'Abgeschlossen' : 'Aktiv' }}</ng-container>
                        </app-status-badge>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </app-page-content-layout>
  `,
})
export class ImportSourceListComponent implements OnInit {
  private readonly dataService = inject(ImportSourceListDataService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly importSources = signal<ImportSource[]>([]);

  readonly breadcrumbs: BreadcrumbItem[] = [{ label: $localize`Importquellen` }];

  ngOnInit(): void {
    this.loadImportSources();
  }

  private loadImportSources(): void {
    this.dataService.getImportSources().subscribe({
      next: (sources) => {
        this.importSources.set(sources);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden der Importquellen`);
        this.loading.set(false);
      },
    });
  }

  formatDate(date: Date): string {
    return formatDateShort(date);
  }
}
