import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { ReportTemplate } from '../../../app/shared/models';
import { ReportTemplateListDataService } from '../../../app/routes/report-templates/report-template-list/report-template-list.data-service';

@Injectable()
export class MockReportTemplateListDataService extends ReportTemplateListDataService {
  private templates: ReportTemplate[] = this.generateTemplates();

  listTemplates(organizationId: string): Observable<ReportTemplate[]> {
    return of([...this.templates]).pipe(delay(300));
  }

  deleteTemplate(organizationId: string, id: string): Observable<void> {
    this.templates = this.templates.filter((t) => t.id !== id);
    return of(undefined).pipe(delay(300));
  }

  private generateTemplates(): ReportTemplate[] {
    return [
      {
        id: 'tpl-1',
        name: 'Haushaltsbericht',
        description: 'Vollständiger Haushaltsbericht mit allen Konten und Buchungen',
        template: '<h1>Haushaltsbericht</h1><p>{{ .Budget.Name }}</p>',
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 30 }),
      },
      {
        id: 'tpl-2',
        name: 'Kassenabschluss',
        description: 'Kassenabschluss für die Prüfung',
        template: '<h1>Kassenabschluss</h1><p>Zeitraum: {{ .Period }}</p>',
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 60 }),
      },
      {
        id: 'tpl-3',
        name: 'Kontenübersicht',
        description: 'Übersicht aller Konten mit Salden',
        template: '<h1>Kontenübersicht</h1>{{ range .Accounts }}<p>{{ .Code }} - {{ .Name }}</p>{{ end }}',
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 45 }),
      },
      {
        id: 'tpl-4',
        name: 'Monatsbericht',
        description: 'Monatlicher Finanzbericht',
        template: '<h1>Monatsbericht {{ .Month }} {{ .Year }}</h1>',
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent({ days: 15 }),
      },
    ];
  }
}
