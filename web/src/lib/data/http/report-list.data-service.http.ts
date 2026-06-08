import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ReportServiceService } from '../../api/services/report-service.service';
import { ReportTemplateServiceService } from '../../api/services/report-template-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { Report, ReportTemplate } from '../../../app/shared/models';
import { ReportListDataService } from '../../../app/routes/reports/report-list/report-list.data-service';
import { mapApiReport, mapApiReportTemplate } from './_mappers';

@Injectable()
export class HttpReportListDataService extends ReportListDataService {
  private readonly reportSvc = inject(ReportServiceService);
  private readonly templateSvc = inject(ReportTemplateServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get parent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  private reportName(uid: string): string {
    return `${this.parent}/reports/${uid}`;
  }

  getReports(): Observable<Report[]> {
    return this.reportSvc.ReportServiceListReports({ parent: this.parent, pageSize: 100 }).pipe(
      map((resp) => (resp.reports ?? []).map((r) => mapApiReport(r))),
    );
  }

  getTemplates(): Observable<ReportTemplate[]> {
    return this.templateSvc.ReportTemplateServiceListReportTemplates({ parent: this.parent, pageSize: 100 }).pipe(
      map((resp) => (resp.report_templates ?? []).map(mapApiReportTemplate)),
    );
  }

  generateReport(templateId: string, name: string): Observable<Report> {
    return this.reportSvc.ReportServiceCreateReport({
      parent: this.parent,
      report: { display_name: name, report_template_id: templateId },
    }).pipe(map((r) => mapApiReport(r, templateId)));
  }

  deleteReport(id: string): Observable<void> {
    return this.reportSvc.ReportServiceDeleteReport(this.reportName(id)).pipe(map(() => undefined));
  }
}
