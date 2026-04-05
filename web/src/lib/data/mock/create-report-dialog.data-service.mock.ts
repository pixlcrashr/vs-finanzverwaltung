import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { CreateReportDialogDataService } from '../../../app/shared/dialogs/create-report-dialog/create-report-dialog.data-service';
import {
  CreatedReport,
  ReportTemplateOption,
} from '../../../app/shared/dialogs/create-report-dialog/create-report-dialog.component';

@Injectable()
export class MockCreateReportDialogDataService extends CreateReportDialogDataService {
  private templates: ReportTemplateOption[] = [
    { id: 't1', name: 'Jahresabschluss' },
    { id: 't2', name: 'Quartalsbericht' },
    { id: 't3', name: 'Kontenübersicht' },
  ];

  getTemplates(): Observable<ReportTemplateOption[]> {
    return of([...this.templates]).pipe(delay(300));
  }

  generateReport(templateId: string, name: string): Observable<CreatedReport> {
    const template = this.templates.find((t) => t.id === templateId);
    return of({
      id: faker.string.uuid(),
      name,
      templateId,
      templateName: template?.name || 'Unknown',
      createdAt: new Date(),
    }).pipe(delay(800));
  }
}
