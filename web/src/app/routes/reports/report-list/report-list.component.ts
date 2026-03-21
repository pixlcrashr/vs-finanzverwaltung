import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
  EmptyStateComponent,
} from '../../../shared/components';
import { formatDateShort } from '../../../shared/utils';
import { Report, ReportTemplate } from '../../../shared/models';
import { ReportListDataService } from './report-list.data-service';

@Component({
  selector: 'app-report-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    DialogModule,
    PageHeaderComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs">
        <app-button variant="primary" (clicked)="showGenerateForm.set(true)">
          Neuen Bericht erstellen
        </app-button>
      </app-page-header>

      <div class="flex flex-1 justify-center overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" text="Berichte werden geladen..." />
        } @else {
          <div class="w-full max-w-6xl space-y-3">
            <!-- Generate Report Form -->
            @if (showGenerateForm()) {
              <div class="bg-white rounded-lg border border-gray-200 p-4">
                <h2 class="text-sm font-semibold text-gray-900 mb-4">
                  Neuen Bericht erstellen
                </h2>
                <div class="space-y-3">
                  <div>
                    <label
                      for="template"
                      class="block text-xs font-medium text-gray-500 mb-1"
                    >
                      Vorlage
                    </label>
                    <select
                      id="template"
                      [(ngModel)]="selectedTemplateId"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Vorlage auswählen...</option>
                      @for (template of templates(); track template.id) {
                        <option [value]="template.id">{{ template.name }}</option>
                      }
                    </select>
                  </div>
                  <div>
                    <label
                      for="name"
                      class="block text-xs font-medium text-gray-500 mb-1"
                    >
                      Berichtsname
                    </label>
                    <input
                      id="name"
                      type="text"
                      [(ngModel)]="reportName"
                      placeholder="z.B. Haushaltsbericht Q1 2026"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div class="flex gap-2">
                    <app-button
                      variant="primary"
                      [disabled]="generating() || !selectedTemplateId || !reportName"
                      (clicked)="generateReport()"
                    >
                      {{ generating() ? 'Wird erstellt...' : 'Bericht erstellen' }}
                    </app-button>
                    <app-button variant="secondary" (clicked)="cancelGenerate()">
                      Abbrechen
                    </app-button>
                  </div>
                </div>
              </div>
            }

            <!-- Reports List -->
            @if (reports().length === 0) {
              <app-empty-state
                title="Keine Berichte vorhanden"
                description="Erstellen Sie einen neuen Bericht aus einer Vorlage."
              >
                <app-button variant="primary" (clicked)="showGenerateForm.set(true)">
                  Ersten Bericht erstellen
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
                          Bericht
                        </th>
                        <th
                          scope="col"
                          class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                        >
                          Vorlage
                        </th>
                        <th
                          scope="col"
                          class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                        >
                          Erstellt am
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
                                Ansehen
                              </a>
                              <button
                                type="button"
                                class="text-xs text-red-600 hover:underline"
                                (click)="openDeleteDialog(report)"
                              >
                                Löschen
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
    </div>

    <ng-template #deleteDialogTemplate>
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-2">
          Bericht löschen
        </h2>
        <p class="text-xs text-gray-600 mb-4">
          Möchten Sie den Bericht
          <span class="font-medium text-gray-900">"{{ reportToDelete()?.name }}"</span>
          wirklich löschen?
        </p>

        <div class="flex justify-end gap-2">
          <app-button variant="secondary" (clicked)="closeDialog()">Abbrechen</app-button>
          <app-button variant="danger" [loading]="deleting()" (clicked)="deleteReport()">
            Löschen
          </app-button>
        </div>
      </div>
    </ng-template>
  `,
})
export class ReportListComponent implements OnInit {
  private readonly dataService = inject(ReportListDataService);
  private readonly dialog = inject(Dialog);

  readonly deleteDialogTemplate = viewChild.required<TemplateRef<unknown>>('deleteDialogTemplate');

  readonly loading = signal(true);
  readonly generating = signal(false);
  readonly deleting = signal(false);
  readonly showGenerateForm = signal(false);
  readonly reports = signal<Report[]>([]);
  readonly templates = signal<ReportTemplate[]>([]);
  readonly reportToDelete = signal<Report | null>(null);

  selectedTemplateId = '';
  reportName = '';

  private dialogRef: ReturnType<typeof this.dialog.open> | null = null;

  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Berichte' }];

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
        this.loading.set(false);
      },
    });

    this.dataService.getTemplates().subscribe({
      next: (templates) => {
        this.templates.set(templates);
      },
    });
  }

  generateReport(): void {
    if (!this.selectedTemplateId || !this.reportName) return;

    this.generating.set(true);
    this.dataService.generateReport(this.selectedTemplateId, this.reportName).subscribe({
      next: (report) => {
        this.reports.update((reports) => [report, ...reports]);
        this.generating.set(false);
        this.cancelGenerate();
      },
      error: () => {
        this.generating.set(false);
      },
    });
  }

  cancelGenerate(): void {
    this.showGenerateForm.set(false);
    this.selectedTemplateId = '';
    this.reportName = '';
  }

  openDeleteDialog(report: Report): void {
    this.reportToDelete.set(report);
    this.dialogRef = this.dialog.open(this.deleteDialogTemplate(), {
      panelClass: ['flex', 'items-center', 'justify-center'],
      backdropClass: 'bg-black/50',
    });
  }

  closeDialog(): void {
    this.dialogRef?.close();
    this.dialogRef = null;
    this.reportToDelete.set(null);
  }

  deleteReport(): void {
    const report = this.reportToDelete();
    if (!report) return;

    this.deleting.set(true);
    this.dataService.deleteReport(report.id).subscribe({
      next: () => {
        this.reports.update((reports) => reports.filter((r) => r.id !== report.id));
        this.deleting.set(false);
        this.closeDialog();
      },
      error: () => {
        this.deleting.set(false);
      },
    });
  }

  formatDate(date: Date): string {
    return formatDateShort(date);
  }
}
