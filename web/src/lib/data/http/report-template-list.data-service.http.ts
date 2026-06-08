import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ReportTemplateServiceService } from '../../api/services/report-template-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { ReportTemplate } from '../../../app/shared/models';
import { ReportTemplateListDataService } from '../../../app/routes/report-templates/report-template-list/report-template-list.data-service';
import { mapApiReportTemplate } from './_mappers';

@Injectable()
export class HttpReportTemplateListDataService extends ReportTemplateListDataService {
  private readonly svc = inject(ReportTemplateServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get parent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  private templateName(uid: string): string {
    return `${this.parent}/reportTemplates/${uid}`;
  }

  getTemplates(): Observable<ReportTemplate[]> {
    return this.svc.ReportTemplateServiceListReportTemplates({ parent: this.parent, pageSize: 100 }).pipe(
      map((resp) => (resp.report_templates ?? []).map(mapApiReportTemplate)),
    );
  }

  deleteTemplate(id: string): Observable<void> {
    return this.svc.ReportTemplateServiceDeleteReportTemplate(this.templateName(id)).pipe(map(() => undefined));
  }
}
