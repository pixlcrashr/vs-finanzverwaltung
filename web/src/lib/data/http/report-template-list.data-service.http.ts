import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ReportTemplateServiceService } from '../../api/services/report-template-service.service';
import { ReportTemplate } from '../../../app/shared/models';
import { ReportTemplateListDataService } from '../../../app/routes/report-templates/report-template-list/report-template-list.data-service';
import { mapApiReportTemplate } from './_mappers';

@Injectable()
export class HttpReportTemplateListDataService extends ReportTemplateListDataService {
  private readonly svc = inject(ReportTemplateServiceService);

  listTemplates(organizationId: string): Observable<ReportTemplate[]> {
    return this.svc.ReportTemplateServiceListReportTemplates({ parent: `organizations/${organizationId}`, pageSize: 100 }).pipe(
      map((resp) => (resp.report_templates ?? []).map(mapApiReportTemplate)),
    );
  }

  deleteTemplate(organizationId: string, id: string): Observable<void> {
    return this.svc.ReportTemplateServiceDeleteReportTemplate(`organizations/${organizationId}/reportTemplates/${id}`).pipe(map(() => undefined));
  }
}
