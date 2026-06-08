import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ReportServiceService } from '../../api/services/report-service.service';
import { ReportTemplateServiceService } from '../../api/services/report-template-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { CreateReportDialogDataService } from '../../../app/shared/dialogs/create-report-dialog/create-report-dialog.data-service';
import {
  CreatedReport,
  ReportTemplateOption,
} from '../../../app/shared/dialogs/create-report-dialog/create-report-dialog.component';

@Injectable()
export class HttpCreateReportDialogDataService extends CreateReportDialogDataService {
  private readonly reportSvc = inject(ReportServiceService);
  private readonly templateSvc = inject(ReportTemplateServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get parent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  getTemplates(): Observable<ReportTemplateOption[]> {
    return this.templateSvc.ReportTemplateServiceListReportTemplates({ parent: this.parent, pageSize: 100 }).pipe(
      map((response) =>
        (response.report_templates ?? []).map((t) => ({
          id: t.uid ?? '',
          name: t.display_name,
        })),
      ),
    );
  }

  generateReport(templateId: string, name: string): Observable<CreatedReport> {
    return this.reportSvc.ReportServiceCreateReport({
      parent: this.parent,
      report: { display_name: name, report_template_id: templateId },
    }).pipe(
      map((r) => ({
        id: r.uid ?? '',
        name: r.display_name,
        templateId,
        templateName: '',
        createdAt: new Date(r.create_time ?? ''),
      })),
    );
  }
}
