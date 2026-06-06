import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  PageContentLayoutComponent,
  BreadcrumbItem,
  ButtonComponent,
  NotificationService,
} from '../../../shared/components';
import { ReportTemplateNewDataService } from './report-template-new.data-service';

@Component({
  selector: 'app-report-template-new',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageContentLayoutComponent,
    ButtonComponent,
  ],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs">
      <div layout-header-actions class="flex gap-2">
          <app-button variant="secondary" (clicked)="cancel()">
            <ng-container i18n>Abbrechen</ng-container>
          </app-button>
          <app-button
            variant="primary"
            [disabled]="saving() || !isValid()"
            (clicked)="save()"
          >
            <ng-container i18n>{{ saving() ? 'Wird erstellt...' : 'Vorlage erstellen' }}</ng-container>
          </app-button>
      </div>

      <div layout-content class="flex flex-1 justify-center">
        <div class="w-full max-w-4xl space-y-3">
          <!-- Basic Info -->
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 i18n class="text-sm font-semibold text-gray-900 mb-4">
              Grundinformationen
            </h2>
            <div class="space-y-3">
              <div>
                <label
                  for="name"
                  class="block text-xs font-medium text-gray-500 mb-1"
                >
                  <ng-container i18n>Name *</ng-container>
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
                  <ng-container i18n>Beschreibung</ng-container>
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
              <h2 i18n class="text-sm font-semibold text-gray-900">
                Vorlage (Go HTML Template)
              </h2>
              <span i18n class="text-xs text-gray-500">
                Verwenden Sie Go-Template-Syntax für dynamische Inhalte
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
            <h3 i18n class="text-xs font-medium text-gray-900 mb-2">
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
    </app-page-content-layout>
  `,
})
export class ReportTemplateNewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dataService = inject(ReportTemplateNewDataService);
  private readonly notifications = inject(NotificationService);

  readonly saving = signal(false);

  private getOrgId(): string {
    let snapshot = this.route.snapshot;
    while (snapshot) {
      const id = snapshot.paramMap.get('orgId');
      if (id) return id;
      snapshot = snapshot.parent!;
    }
    return '';
  }

  name = '';
  description = '';
  templateContent = '';

  readonly placeholderText = `<div>
  <h1>{{ .Budget.Name }}</h1>
  <table>
    {{ range .Accounts }}
    <tr>
      <td>{{ .Code }}</td>
      <td>{{ .Name }}</td>
      <td>{{ .Balance }}</td>
    </tr>
    {{ end }}
  </table>
</div>`;

  readonly variables = [
    { code: '{{ .Budget.Name }}', label: $localize`Budgetname` },
    { code: '{{ .Budget.StartDate }}', label: $localize`Startdatum` },
    { code: '{{ .Budget.EndDate }}', label: $localize`Enddatum` },
    { code: '{{ range .Accounts }}...{{ end }}', label: $localize`Kontenliste` },
    { code: '{{ .Code }}', label: $localize`Kontonummer` },
    { code: '{{ .Name }}', label: $localize`Kontoname` },
    { code: '{{ .Balance }}', label: $localize`Kontosaldo` },
    { code: '{{ .Date | formatDate }}', label: $localize`Datum formatieren` },
  ];

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: $localize`Berichtsvorlagen`, path: '' },
    { label: $localize`Neu` },
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
        this.router.navigate(['/organizations', this.getOrgId(), 'reportTemplates']);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Erstellen der Berichtsvorlage`);
        this.saving.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/organizations', this.getOrgId(), 'reportTemplates']);
  }
}
