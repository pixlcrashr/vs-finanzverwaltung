import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../components';

export type ExportFormat = 'json' | 'xml' | 'csv' | 'ods' | 'pdf' | 'html';

export interface ReportTemplateOption {
  id: string;
  name: string;
}

export interface ExportMatrixDialogInput {
  organizationId: string;
  templates: ReportTemplateOption[];
}

export interface ExportMatrixDialogOutput {
  confirmed: boolean;
  format?: ExportFormat;
  templateId?: string;
}

@Component({
  selector: 'app-export-matrix-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, ButtonComponent],
  template: `
    <div class="bg-white rounded-lg shadow-xl p-4 w-[480px]">
      <h2 i18n class="text-sm font-semibold text-gray-900 mb-4">
        Matrix exportieren
      </h2>

      <div class="space-y-4">
        <!-- Format Selection -->
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-2" i18n>
            Format
          </label>
          <div class="grid grid-cols-3 gap-2">
            @for (fmt of formats; track fmt.value) {
              <button
                type="button"
                (click)="selectedFormat.set(fmt.value)"
                class="px-3 py-2 text-xs rounded border transition-colors cursor-pointer"
                [class.border-blue-600]="selectedFormat() === fmt.value"
                [class.bg-blue-50]="selectedFormat() === fmt.value"
                [class.text-blue-700]="selectedFormat() === fmt.value"
                [class.border-gray-300]="selectedFormat() !== fmt.value"
                [class.text-gray-700]="selectedFormat() !== fmt.value"
                [class.hover-bg-gray-50]="selectedFormat() !== fmt.value"
              >
                {{ fmt.label }}
              </button>
            }
          </div>
        </div>

        <!-- Template Selection (only for PDF and HTML) -->
        @if (needsTemplate()) {
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1" i18n>
              Vorlage
            </label>
            <select
              [(ngModel)]="selectedTemplateId"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" i18n>Vorlage auswählen...</option>
              @for (template of data.templates; track template.id) {
                <option [value]="template.id">{{ template.name }}</option>
              }
            </select>
          </div>
        }

        <!-- Info text for auto-generated formats -->
        @if (!needsTemplate()) {
          <p class="text-xs text-gray-500" i18n>
            Dieses Format wird automatisch generiert.
          </p>
        }
      </div>

      <div class="flex justify-end gap-2 mt-4">
        <app-button variant="secondary" (clicked)="cancel()">
          <ng-container i18n>Abbrechen</ng-container>
        </app-button>
        <app-button
          variant="primary"
          [disabled]="!canExport()"
          (clicked)="confirm()"
        >
          <ng-container i18n>Exportieren</ng-container>
        </app-button>
      </div>
    </div>
  `,
})
export class ExportMatrixDialogComponent {
  private readonly dialogRef = inject(DialogRef<ExportMatrixDialogOutput>);
  readonly data = inject<ExportMatrixDialogInput>(DIALOG_DATA);

  readonly selectedFormat = signal<ExportFormat>('json');
  selectedTemplateId = '';

  readonly formats: { value: ExportFormat; label: string }[] = [
    { value: 'json', label: 'JSON' },
    { value: 'xml', label: 'XML' },
    { value: 'csv', label: 'CSV' },
    { value: 'ods', label: 'ODS' },
    { value: 'pdf', label: 'PDF' },
    { value: 'html', label: 'HTML' },
  ];

  needsTemplate = computed(() =>
    this.selectedFormat() === 'pdf' || this.selectedFormat() === 'html'
  );

  canExport(): boolean {
    if (this.needsTemplate()) {
      return !!this.selectedTemplateId;
    }
    return true;
  }

  cancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  confirm(): void {
    if (!this.canExport()) return;
    this.dialogRef.close({
      confirmed: true,
      format: this.selectedFormat(),
      templateId: this.needsTemplate() ? this.selectedTemplateId : undefined,
    });
  }
}
