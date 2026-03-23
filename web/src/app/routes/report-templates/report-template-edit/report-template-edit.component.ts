import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
} from '../../../shared/components';
import { formatDateShort } from '../../../shared/utils';
import { ReportTemplate } from '../../../shared/models';
import { ReportTemplateEditDataService } from './report-template-edit.data-service';

@Component({
  selector: 'app-report-template-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeaderComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs">
        <div class="flex gap-2">
          <app-button variant="secondary" (clicked)="cancel()">
            Abbrechen
          </app-button>
          <app-button
            variant="primary"
            [disabled]="saving() || !isValid()"
            (clicked)="save()"
          >
            {{ saving() ? 'Wird gespeichert...' : 'Speichern' }}
          </app-button>
        </div>
      </app-page-header>

      <div class="flex flex-1 justify-center overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" text="Vorlage wird geladen..." />
        } @else if (template()) {
          <div class="w-full max-w-3xl space-y-3">
            <!-- Basic Info -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="text-sm font-semibold text-gray-900 mb-4">
                Grundinformationen
              </h2>
              <div class="space-y-3">
                <div>
                  <label
                    for="name"
                    class="block text-xs font-medium text-gray-500 mb-1"
                  >
                    Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    [(ngModel)]="name"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    for="description"
                    class="block text-xs font-medium text-gray-500 mb-1"
                  >
                    Beschreibung
                  </label>
                  <textarea
                    id="description"
                    [(ngModel)]="description"
                    rows="2"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Template Editor -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-sm font-semibold text-gray-900">
                  Vorlage (Go Template HTML)
                </h2>
                <span class="text-xs text-gray-500">
                  Verwenden Sie Go-Template-Syntax für dynamische Inhalte
                </span>
              </div>
              <textarea
                [(ngModel)]="templateContent"
                rows="20"
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              ></textarea>
            </div>

            <!-- Help Section -->
            <div class="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <h3 class="text-xs font-medium text-gray-900 mb-2">
                Verfügbare Variablen
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
                @for (variable of variables; track variable.code) {
                  <div><code class="bg-gray-100 px-1 rounded">{{ variable.code }}</code> - {{ variable.label }}</div>
                }
              </div>
            </div>

            <!-- Metadata -->
            <div class="text-xs text-gray-500">
              Erstellt: {{ formatDate(template()!.createdAt) }} ·
              Zuletzt aktualisiert: {{ formatDate(template()!.updatedAt) }}
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ReportTemplateEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dataService = inject(ReportTemplateEditDataService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly template = signal<ReportTemplate | null>(null);

  name = '';
  description = '';
  templateContent = '';

  readonly variables = [
    { code: '{{ .Budget.Name }}', label: 'Budgetname' },
    { code: '{{ .Budget.StartDate }}', label: 'Startdatum' },
    { code: '{{ .Budget.EndDate }}', label: 'Enddatum' },
    { code: '{{ range .Accounts }}...{{ end }}', label: 'Kontenliste' },
    { code: '{{ .Code }}', label: 'Kontonummer' },
    { code: '{{ .Name }}', label: 'Kontoname' },
    { code: '{{ .Balance }}', label: 'Kontosaldo' },
    { code: '{{ .Date | formatDate }}', label: 'Datum formatieren' },
  ];

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Berichtsvorlagen', path: '/reportTemplates' },
    { label: 'Bearbeiten' },
  ];

  private templateId = '';

  ngOnInit(): void {
    this.templateId = this.route.snapshot.paramMap.get('id') || '';
    if (this.templateId) {
      this.loadTemplate();
    }
  }

  private loadTemplate(): void {
    this.dataService.getTemplate(this.templateId).subscribe({
      next: (template) => {
        this.template.set(template);
        this.name = template.name;
        this.description = template.description;
        this.templateContent = template.template;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  isValid(): boolean {
    return this.name.trim().length > 0;
  }

  save(): void {
    if (!this.isValid()) return;

    this.saving.set(true);
    this.dataService.updateTemplate(this.templateId, {
      name: this.name.trim(),
      description: this.description.trim(),
      template: this.templateContent,
    }).subscribe({
      next: (updated) => {
        this.template.set(updated);
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/reportTemplates']);
  }

  formatDate(date: Date): string {
    return formatDateShort(date);
  }
}
