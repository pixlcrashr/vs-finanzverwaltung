import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { ReportTemplate } from '../../../app/shared/models';
import { ReportTemplateNewDataService } from '../../../app/routes/report-templates/report-template-new/report-template-new.data-service';

@Injectable()
export class MockReportTemplateNewDataService extends ReportTemplateNewDataService {
  createTemplate(organizationId: string, name: string, description: string, template: string): Observable<ReportTemplate> {
    const result: ReportTemplate = {
      id: faker.string.uuid(),
      name,
      description,
      template,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return of(result).pipe(delay(500));
  }
}
