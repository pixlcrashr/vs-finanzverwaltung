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
  LoadingSpinnerComponent,
  EmptyStateComponent,
  NotificationService,
} from '../../../shared/components';
import {
  ConfirmDeleteDialogComponent,
  ConfirmDeleteDialogInput,
  ConfirmDeleteDialogOutput,
} from '../../../shared/dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import { formatDateShort } from '../../../shared/utils';
import { ReportTemplate } from '../../../shared/models';
import { ReportTemplateListDataService } from './report-template-list.data-service';

@Component({
  selector: 'app-report-template-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageContentLayoutComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs">
      <a
        layout-header-actions
        routerLink="/reportTemplates/new"
        class="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:opacity-90"
      >
        <ng-container i18n>Neue Vorlage</ng-container>
      </a>

      <div layout-content class="flex flex-1 justify-center">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Vorlagen werden geladen..." />
        } @else if (templates().length === 0) {
          <app-empty-state
            i18n-title title="Keine Vorlagen vorhanden"
            i18n-description description="Erstelle deine erste Berichtsvorlage."
          >
            <a
              routerLink="/reportTemplates/new"
              class="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:opacity-90"
            >
              <ng-container i18n>Erste Vorlage erstellen</ng-container>
            </a>
          </app-empty-state>
        } @else {
          <div class="w-full max-w-3xl">
            <div class="bg-white rounded-lg border border-gray-200">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        <ng-container i18n>Name</ng-container>
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        <ng-container i18n>Beschreibung</ng-container>
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        <ng-container i18n>Aktualisiert</ng-container>
                      </th>
                      <th scope="col" class="px-3 py-2 text-right">
                        <span class="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    @for (template of templates(); track template.id) {
                      <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-3 py-2 text-xs text-gray-900">{{ template.name }}</td>
                        <td class="px-3 py-2 text-xs text-gray-900">
                          <div class="max-w-md truncate" [title]="template.description || ''">
                            {{ template.description || '-' }}
                          </div>
                        </td>
                        <td class="px-3 py-2 text-xs text-gray-900">{{ formatDate(template.updatedAt) }}</td>
                        <td class="px-3 py-2 text-right text-xs">
                          <div class="flex items-center justify-end gap-2">
                            <a
                              [routerLink]="['/reportTemplates', template.id, 'edit']"
                              class="text-xs text-blue-600 hover:underline"
                            >
                              <ng-container i18n>Bearbeiten</ng-container>
                            </a>
                            <button
                              type="button"
                              class="text-xs text-red-600 hover:underline"
                              (click)="openDeleteDialog(template)"
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
          </div>
        }
      </div>
    </app-page-content-layout>
  `,
})
export class ReportTemplateListComponent implements OnInit {
  private readonly dataService = inject(ReportTemplateListDataService);
  private readonly dialog = inject(Dialog);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly templates = signal<ReportTemplate[]>([]);

  readonly breadcrumbs: BreadcrumbItem[] = [{ label: $localize`Berichtsvorlagen` }];

  ngOnInit(): void {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    this.dataService.getTemplates().subscribe({
      next: (templates) => {
        this.templates.set(templates);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden der Berichtsvorlagen`);
        this.loading.set(false);
      },
    });
  }

  openDeleteDialog(template: ReportTemplate): void {
    const dialogRef = this.dialog.open<ConfirmDeleteDialogOutput, ConfirmDeleteDialogInput>(
      ConfirmDeleteDialogComponent,
      {
        backdropClass: 'cdk-overlay-dark-backdrop',
        width: '500px',
        data: {
          title: $localize`Vorlage löschen`,
          message: $localize`Möchten Sie die Vorlage wirklich löschen?`,
          itemName: template.name,
        },
      }
    );

    dialogRef.closed.subscribe((result) => {
      if (result?.confirmed) {
        this.deleteTemplate(template);
      }
    });
  }

  private deleteTemplate(template: ReportTemplate): void {
    this.dataService.deleteTemplate(template.id).subscribe({
      next: () => {
        this.templates.update((templates) => templates.filter((t) => t.id !== template.id));
      },
    });
  }

  formatDate(date: Date): string {
    return formatDateShort(date);
  }
}
