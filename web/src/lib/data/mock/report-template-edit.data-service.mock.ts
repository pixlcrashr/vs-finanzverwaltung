import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { ReportTemplate } from '../../../app/shared/models';
import {
  ReportTemplateEditDataService,
  UpdateTemplateInput,
} from '../../../app/routes/report-templates/report-template-edit/report-template-edit.data-service';

@Injectable()
export class MockReportTemplateEditDataService extends ReportTemplateEditDataService {
  private template: ReportTemplate = {
    id: faker.string.uuid(),
    name: 'Haushaltsbericht',
    description: 'Vollständiger Haushaltsbericht mit allen Konten und Buchungen',
    template: `<div style="font-family: system-ui; padding: 20px;">
  <h1>{{budget.name}}</h1>
  <p>Zeitraum: {{budget.startDate}} - {{budget.endDate}}</p>

  <h2>Kontenübersicht</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr>
        <th style="text-align: left; padding: 8px; border-bottom: 2px solid #ccc;">Konto</th>
        <th style="text-align: right; padding: 8px; border-bottom: 2px solid #ccc;">Budget</th>
        <th style="text-align: right; padding: 8px; border-bottom: 2px solid #ccc;">Ist</th>
      </tr>
    </thead>
    <tbody>
      {{#each accounts}}
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">{{code}} {{name}}</td>
        <td style="text-align: right; padding: 8px; border-bottom: 1px solid #eee;">{{budget}}</td>
        <td style="text-align: right; padding: 8px; border-bottom: 1px solid #eee;">{{actual}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>
</div>`,
    createdAt: faker.date.past({ years: 1 }),
    updatedAt: faker.date.recent({ days: 30 }),
  };

  getTemplate(organizationId: string, id: string): Observable<ReportTemplate> {
    return of({ ...this.template, id }).pipe(delay(300));
  }

  updateTemplate(organizationId: string, id: string, input: UpdateTemplateInput): Observable<ReportTemplate> {
    this.template = {
      ...this.template,
      id,
      name: input.name,
      description: input.description,
      template: input.template,
      updatedAt: new Date(),
    };
    return of({ ...this.template }).pipe(delay(400));
  }
}
