import { inject, Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import { listReportTemplates, createReport } from '../../api/functions';
import { CreateReportDialogDataService } from '../../../app/shared/dialogs/create-report-dialog/create-report-dialog.data-service';
import {
  CreatedReport,
  ReportTemplateOption,
} from '../../../app/shared/dialogs/create-report-dialog/create-report-dialog.component';

@Injectable()
export class HttpCreateReportDialogDataService extends CreateReportDialogDataService {
  private readonly api = inject(Api);

  getTemplates(): Observable<ReportTemplateOption[]> {
    return from(
      this.api.invoke(listReportTemplates, { pageSize: 100 })
    ).pipe(
      map((response) =>
        (response.reportTemplates ?? []).map((template) => ({
          id: template.id,
          name: template.displayName,
        }))
      )
    );
  }

  generateReport(templateId: string, name: string): Observable<CreatedReport> {
    return from(
      this.api.invoke(createReport, {
        body: {
          reportTemplateId: templateId,
          displayName: name,
        },
      })
    ).pipe(
      map((response) => ({
        id: response.id,
        name: response.displayName,
        templateId: templateId,
        templateName: '',
        createdAt: new Date(response.createTime),
      }))
    );
  }
}
