import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { ButtonComponent, LoadingSpinnerComponent } from '../../components';
import { CreateReportDialogDataService } from './create-report-dialog.data-service';

export interface CreateReportDialogInput {
  organizationId: string;
}

export interface ReportTemplateOption {
  id: string;
  name: string;
}

export interface CreatedReport {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  createdAt: Date;
}

export interface CreateReportDialogOutput {
  created: boolean;
  report?: CreatedReport;
}

@Component({
  selector: 'app-create-report-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonComponent, LoadingSpinnerComponent],
  template: `
    <div class="bg-white rounded-lg shadow-xl p-4">
      <h2 i18n class="text-sm font-semibold text-gray-900 mb-4">
        Neuen Bericht erstellen
      </h2>

      @if (loadingTemplates()) {
        <div class="flex justify-center py-4">
          <app-loading-spinner i18n-text text="Vorlagen werden geladen..." />
        </div>
      } @else {
        <div class="space-y-3">
          <div>
            <label
              for="template"
              class="block text-xs font-medium text-gray-500 mb-1"
            >
              <ng-container i18n>Vorlage</ng-container>
            </label>
            <select
              id="template"
              [(ngModel)]="selectedTemplateId"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option i18n value="">Vorlage auswählen...</option>
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
              <ng-container i18n>Berichtsname</ng-container>
            </label>
            <input
              id="name"
              type="text"
              autocomplete="off"
              [(ngModel)]="reportName"
              i18n-placeholder
              placeholder="z.B. Haushaltsbericht Q1 2026"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex justify-end gap-2">
            <app-button variant="secondary" (clicked)="cancel()">
              <ng-container i18n>Abbrechen</ng-container>
            </app-button>
            <app-button
              variant="primary"
              [disabled]="!selectedTemplateId || !reportName"
              [loading]="generating()"
              (clicked)="generate()"
            >
              <ng-container i18n>{{ generating() ? 'Wird erstellt...' : 'Bericht erstellen' }}</ng-container>
            </app-button>
          </div>
        </div>
      }
    </div>
  `,
})
export class CreateReportDialogComponent implements OnInit {
  private readonly dialogRef = inject(DialogRef<CreateReportDialogOutput>);
  private readonly dataService = inject(CreateReportDialogDataService);
  readonly data = inject<CreateReportDialogInput>(DIALOG_DATA);

  readonly loadingTemplates = signal(true);
  readonly generating = signal(false);
  readonly templates = signal<ReportTemplateOption[]>([]);

  selectedTemplateId = '';
  reportName = '';

  ngOnInit(): void {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    this.dataService.listTemplates(this.data.organizationId).subscribe({
      next: (templates) => {
        this.templates.set(templates);
        this.loadingTemplates.set(false);
      },
      error: () => {
        this.loadingTemplates.set(false);
      },
    });
  }

  cancel(): void {
    this.dialogRef.close({ created: false });
  }

  generate(): void {
    if (!this.selectedTemplateId || !this.reportName) return;

    this.generating.set(true);

    this.dataService.generateReport(this.data.organizationId, this.selectedTemplateId, this.reportName).subscribe({
      next: (report) => {
        this.generating.set(false);
        this.dialogRef.close({
          created: true,
          report,
        });
      },
      error: () => {
        this.generating.set(false);
      },
    });
  }
}
