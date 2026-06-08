import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ReportTemplateServiceService } from '../../api/services/report-template-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { ReportTemplate } from '../../../app/shared/models';
import {
  ReportTemplateEditDataService,
  UpdateTemplateInput,
} from '../../../app/routes/report-templates/report-template-edit/report-template-edit.data-service';
import { mapApiReportTemplate } from './_mappers';

@Injectable()
export class HttpReportTemplateEditDataService extends ReportTemplateEditDataService {
  private readonly svc = inject(ReportTemplateServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private templateName(id: string): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}/reportTemplates/${id}`;
  }

  getTemplate(id: string): Observable<ReportTemplate> {
    return this.svc.ReportTemplateServiceGetReportTemplate(this.templateName(id)).pipe(
      map(mapApiReportTemplate),
    );
  }

  updateTemplate(id: string, input: UpdateTemplateInput): Observable<ReportTemplate> {
    return this.svc.ReportTemplateServiceUpdateReportTemplate({
      reportTemplateName: this.templateName(id),
      reportTemplate: { display_name: input.name, template: input.template },
    }).pipe(map(mapApiReportTemplate));
  }
}
