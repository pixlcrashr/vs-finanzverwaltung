import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import {
  listReports,
  listReportTemplates,
  createReport,
  deleteReport,
} from '../../api/functions';
import { Report, ReportTemplate } from '../../../app/shared/models';
import { ReportListDataService } from '../../../app/routes/reports/report-list/report-list.data-service';
import { mapApiReport, mapApiReportTemplate } from './_mappers';

@Injectable()
export class HttpReportListDataService extends ReportListDataService {
  private readonly api = inject(Api);

  getReports(): Observable<Report[]> {
    return from(
      this.api.invoke(listReports, { pageSize: 100 }),
    ).pipe(map((resp) => (resp.reports ?? []).map((r) => mapApiReport(r))));
  }

  getTemplates(): Observable<ReportTemplate[]> {
    return from(
      this.api.invoke(listReportTemplates, { pageSize: 100 }),
    ).pipe(map((resp) => (resp.reportTemplates ?? []).map(mapApiReportTemplate)));
  }

  generateReport(templateId: string, name: string): Observable<Report> {
    return from(
      this.api.invoke(createReport, {
        body: { displayName: name, reportTemplateId: templateId },
      }),
    ).pipe(map((r) => mapApiReport(r, templateId)));
  }

  deleteReport(id: string): Observable<void> {
    return from(
      this.api.invoke(deleteReport, { reportId: id }),
    ).pipe(map(() => undefined));
  }
}
