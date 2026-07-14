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
  LoadingSpinnerComponent,
  EmptyStateComponent,
  ButtonComponent,
  NotificationService,
} from '../../../shared/components';
import {
  LedgerYearListDataService,
  LedgerYearListItem,
} from './ledger-year-list.data-service';
import { HasPermissionPipe } from '../../../../lib/authz/has-permission.pipe';
import { Permission, Permissions } from '../../../../lib/authz/permissions';

@Component({
  selector: 'app-ledger-year-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageContentLayoutComponent, LoadingSpinnerComponent, EmptyStateComponent, ButtonComponent, HasPermissionPipe],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs">
      <div layout-content class="flex flex-1 justify-center">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Geschäftsjahre werden geladen..." />
        } @else if (years().length === 0) {
          <app-empty-state
            i18n-title title="Keine Geschäftsjahre vorhanden"
            i18n-description description="Es wurden noch keine Geschäftsjahre erstellt."
          />
        } @else {
          <div class="w-full max-w-3xl space-y-3">
            @for (year of years(); track year.id) {
              <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {{ year.year }}
                    </h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      @if (year.isClosed) {
                        <span i18n>Geschlossen</span>
                      } @else {
                        <span i18n>Offen für Importe</span>
                      }
                    </p>
                  </div>
                  <div class="flex items-center gap-3">
                    @if (year.isClosed) {
                      <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        <ng-container i18n>Geschlossen</ng-container>
                      </span>
                    } @else {
                      <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        <ng-container i18n>Offen</ng-container>
                      </span>
                      @if (Permissions.LEDGER_YEAR_CLOSE | hasPermission) {
                        <app-button
                          variant="secondary"
                          size="sm"
                          [disabled]="closingYear() === year.id"
                          [loading]="closingYear() === year.id"
                          (clicked)="closeYear(year)"
                        >
                          <ng-container i18n>Schließen</ng-container>
                        </app-button>
                      }
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
export class LedgerYearListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(LedgerYearListDataService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly years = signal<LedgerYearListItem[]>([]);
  readonly closingYear = signal<string | null>(null);
  readonly Permissions = Permissions;

  readonly orgId = signal<string>('');

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: $localize`Geschäftsjahre` }
  ];

  ngOnInit(): void {
    const orgId = this.route.snapshot.paramMap.get('orgId');
    if (orgId) {
      this.orgId.set(orgId);
      this.loadYears();
    }
  }

  private loadYears(): void {
    const orgId = this.orgId();
    if (!orgId) return;

    this.loading.set(true);

    this.dataService.listLedgerYears(orgId).subscribe({
      next: (result) => {
        this.years.set(result.years);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden der Geschäftsjahre`);
        this.loading.set(false);
      },
    });
  }

  closeYear(year: LedgerYearListItem): void {
    if (year.isClosed) return;

    this.closingYear.set(year.id);

    this.dataService.closeLedgerYear(this.orgId(), year.id, year.etag).subscribe({
      next: () => {
        this.notifications.success($localize`Geschäftsjahr erfolgreich geschlossen`);
        this.closingYear.set(null);
        this.loadYears();
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Schließen des Geschäftsjahres`);
        this.closingYear.set(null);
      },
    });
  }
}
