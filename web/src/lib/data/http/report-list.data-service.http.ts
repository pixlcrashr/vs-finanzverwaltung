import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ReportServiceService } from '../../api/services/report-service.service';
import { ReportTemplateServiceService } from '../../api/services/report-template-service.service';
import { Report, ReportTemplate } from '../../../app/shared/models';
import { ReportListDataService } from '../../../app/routes/reports/report-list/report-list.data-service';
import { mapApiReport, mapApiReportTemplate } from './_mappers';

@Injectable()
export class HttpReportListDataService extends ReportListDataService {
  private readonly reportSvc = inject(ReportServiceService);
  private readonly templateSvc = inject(ReportTemplateServiceService);
  private reportName(organizationId: string, uid: string): string {
    return `organizations/${organizationId}/reports/${uid}`;
  }

  listReports(organizationId: string): Observable<Report[]> {
    return this.reportSvc.ReportServiceListReports({ parent: `organizations/${organizationId}`, pageSize: 100 }).pipe(
      map((resp) => (resp.reports ?? []).map((r) => mapApiReport(r))),
    );
  }

  listTemplates(organizationId: string): Observable<ReportTemplate[]> {
    return this.templateSvc.ReportTemplateServiceListReportTemplates({ parent: `organizations/${organizationId}`, pageSize: 100 }).pipe(
      map((resp) => (resp.report_templates ?? []).map(mapApiReportTemplate)),
    );
  }

  generateReport(organizationId: string, templateId: string, name: string): Observable<Report> {
    return this.reportSvc.ReportServiceCreateReport({
      parent: `organizations/${organizationId}`,
      report: { display_name: name, report_template_id: templateId },
    }).pipe(map((r) => mapApiReport(r, templateId)));
  }

  deleteReport(organizationId: string, id: string): Observable<void> {
    return this.reportSvc.ReportServiceDeleteReport(this.reportName(organizationId, id)).pipe(map(() => undefined));
  }
}
