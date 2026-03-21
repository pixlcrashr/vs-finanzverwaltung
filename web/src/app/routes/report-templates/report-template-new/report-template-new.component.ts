import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
} from '../../../shared/components';
import { ReportTemplateNewDataService } from './report-template-new.data-service';

@Component({
  selector: 'app-report-template-new',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeaderComponent,
    ButtonComponent,
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
            {{ saving() ? 'Wird erstellt...' : 'Vorlage erstellen' }}
          </app-button>
        </div>
      </app-page-header>

      <div class="flex flex-1 justify-center overflow-auto p-4">
        <div class="w-full max-w-4xl space-y-3">
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
                  placeholder="z.B. Haushaltsbericht"
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
                  placeholder="Kurze Beschreibung der Vorlage..."
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Template Editor -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-sm font-semibold text-gray-900">
                Vorlage (Handlebars HTML)
              </h2>
              <span class="text-xs text-gray-500">
                Verwenden Sie Handlebars-Syntax für dynamische Inhalte
              </span>
            </div>
            <textarea
              [(ngModel)]="templateContent"
              rows="20"
              [placeholder]="placeholderText"
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
        </div>
      </div>
    </div>
  `,
})
export class ReportTemplateNewComponent {
  private readonly router = inject(Router);
  private readonly dataService = inject(ReportTemplateNewDataService);

  readonly saving = signal(false);

  name = '';
  description = '';
  templateContent = '';

  readonly placeholderText = `<div>
  <h1>{{budget.name}}</h1>
  <table>
    {{#each accounts}}
    <tr>
      <td>{{code}}</td>
      <td>{{name}}</td>
      <td>{{balance}}</td>
    </tr>
    {{/each}}
  </table>
</div>`;

  readonly variables = [
    { code: '{{budget.name}}', label: 'Budgetname' },
    { code: '{{budget.startDate}}', label: 'Startdatum' },
    { code: '{{budget.endDate}}', label: 'Enddatum' },
    { code: '{{#each accounts}}', label: 'Kontenliste' },
    { code: '{{code}}', label: 'Kontonummer' },
    { code: '{{name}}', label: 'Kontoname' },
    { code: '{{balance}}', label: 'Kontosaldo' },
    { code: '{{formatDate date}}', label: 'Datum formatieren' },
  ];

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Berichtsvorlagen', path: '/report-templates' },
    { label: 'Neu' },
  ];

  isValid(): boolean {
    return this.name.trim().length > 0;
  }

  save(): void {
    if (!this.isValid()) return;

    this.saving.set(true);
    this.dataService.createTemplate({
      name: this.name.trim(),
      description: this.description.trim(),
      template: this.templateContent,
    }).subscribe({
      next: () => {
        this.router.navigate(['/report-templates']);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/report-templates']);
  }
}
