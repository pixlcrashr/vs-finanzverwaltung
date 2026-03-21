import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { ReportTemplate } from '../../../app/shared/models';
import {
  ReportTemplateNewDataService,
  CreateTemplateInput,
} from '../../../app/routes/report-templates/report-template-new/report-template-new.data-service';

@Injectable()
export class MockReportTemplateNewDataService extends ReportTemplateNewDataService {
  createTemplate(input: CreateTemplateInput): Observable<ReportTemplate> {
    const template: ReportTemplate = {
      id: faker.string.uuid(),
      name: input.name,
      description: input.description,
      template: input.template,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return of(template).pipe(delay(500));
  }
}
