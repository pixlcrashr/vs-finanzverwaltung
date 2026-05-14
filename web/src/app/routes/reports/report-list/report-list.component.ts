import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import {
  PageContentLayoutComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
  EmptyStateComponent,
  NotificationService,
} from '../../../shared/components';
import {
  ConfirmDeleteDialogComponent,
  ConfirmDeleteDialogInput,
  ConfirmDeleteDialogOutput,
} from '../../../shared/dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import {
  CreateReportDialogComponent,
  CreateReportDialogOutput,
} from '../../../shared/dialogs/create-report-dialog/create-report-dialog.component';

import { formatDateShort } from '../../../shared/utils';
import { Report } from '../../../shared/models';
import { ReportListDataService } from './report-list.data-service';

@Component({
  selector: 'app-report-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageContentLayoutComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs">
      <app-button layout-header-actions variant="primary" (clicked)="openCreateDialog()">
        <ng-container i18n>Neuen Bericht erstellen</ng-container>
      </app-button>

      <div layout-content class="flex flex-1 justify-center">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Berichte werden geladen..." />
        } @else {
          <div class="w-full max-w-3xl space-y-3">
            <!-- Reports List -->
            @if (reports().length === 0) {
              <app-empty-state
                i18n-title title="Keine Berichte vorhanden"
                i18n-description description="Erstellen Sie einen neuen Bericht aus einer Vorlage."
              >
                <app-button variant="primary" (clicked)="openCreateDialog()">
                  <ng-container i18n>Ersten Bericht erstellen</ng-container>
                </app-button>
              </app-empty-state>
            } @else {
              <div class="bg-white rounded-lg border border-gray-200">
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                        >
                          <ng-container i18n>Bericht</ng-container>
                        </th>
                        <th
                          scope="col"
                          class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                        >
                          <ng-container i18n>Vorlage</ng-container>
                        </th>
                        <th
                          scope="col"
                          class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                        >
                          <ng-container i18n>Erstellt am</ng-container>
                        </th>
                        <th scope="col" class="px-3 py-2 text-right">
                          <span class="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 bg-white">
                      @for (report of reports(); track report.id) {
                        <tr class="hover:bg-gray-50 transition-colors">
                          <td class="px-3 py-2 text-xs text-gray-900">{{ report.name }}</td>
                          <td class="px-3 py-2 text-xs text-gray-900">{{ report.templateName }}</td>
                          <td class="px-3 py-2 text-xs text-gray-900">{{ formatDate(report.createdAt) }}</td>
                          <td class="px-3 py-2 text-right text-xs">
                            <div class="flex items-center justify-end gap-2">
                              <a
                                [routerLink]="['/reports', report.id, 'view']"
                                class="text-xs text-blue-600 hover:underline"
                              >
                                <ng-container i18n>Ansehen</ng-container>
                              </a>
                              <button
                                type="button"
                                class="text-xs text-red-600 hover:underline"
                                (click)="openDeleteDialog(report)"
                              >
                                <ng-container i18n>Löschen</ng-container>
                              </button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </app-page-content-layout>
  `,
})
export class ReportListComponent implements OnInit {
  private readonly dataService = inject(ReportListDataService);
  private readonly dialog = inject(Dialog);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly reports = signal<Report[]>([]);

  readonly breadcrumbs: BreadcrumbItem[] = [{ label: $localize`Berichte` }];

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.dataService.getReports().subscribe({
      next: (reports) => {
        this.reports.set(reports);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden der Berichte`);
        this.loading.set(false);
      },
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open<CreateReportDialogOutput>(
      CreateReportDialogComponent,
      {
        backdropClass: 'cdk-overlay-dark-backdrop',
        width: '500px',
      }
    );

    dialogRef.closed.subscribe((result) => {
      if (result?.created && result.report) {
        this.reports.update((reports) => [
          {
            id: result.report!.id,
            templateId: result.report!.templateId,
            name: result.report!.name,
            templateName: result.report!.templateName,
            createdAt: result.report!.createdAt,
          },
          ...reports,
        ]);
      }
    });
  }

  openDeleteDialog(report: Report): void {
    const dialogRef = this.dialog.open<ConfirmDeleteDialogOutput, ConfirmDeleteDialogInput>(
      ConfirmDeleteDialogComponent,
      {
        backdropClass: 'cdk-overlay-dark-backdrop',
        width: '500px',
        data: {
          title: $localize`Bericht löschen`,
          message: $localize`Möchten Sie den Bericht wirklich löschen?`,
          itemName: report.name,
        },
      }
    );

    dialogRef.closed.subscribe((result) => {
      if (result?.confirmed) {
        this.deleteReport(report);
      }
    });
  }

  private deleteReport(report: Report): void {
    this.dataService.deleteReport(report.id).subscribe({
      next: () => {
        this.reports.update((reports) => reports.filter((r) => r.id !== report.id));
      },
    });
  }

  formatDate(date: Date): string {
    return formatDateShort(date);
  }
}
