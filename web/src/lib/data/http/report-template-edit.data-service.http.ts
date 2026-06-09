import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ReportTemplateServiceService } from '../../api/services/report-template-service.service';
import { ReportTemplate } from '../../../app/shared/models';
import {
  ReportTemplateEditDataService,
  UpdateTemplateInput,
} from '../../../app/routes/report-templates/report-template-edit/report-template-edit.data-service';
import { mapApiReportTemplate } from './_mappers';

@Injectable()
export class HttpReportTemplateEditDataService extends ReportTemplateEditDataService {
  private readonly svc = inject(ReportTemplateServiceService);

  getTemplate(organizationId: string, id: string): Observable<ReportTemplate> {
    return this.svc.ReportTemplateServiceGetReportTemplate(`organizations/${organizationId}/reportTemplates/${id}`).pipe(
      map(mapApiReportTemplate),
    );
  }

  updateTemplate(organizationId: string, id: string, input: UpdateTemplateInput): Observable<ReportTemplate> {
    return this.svc.ReportTemplateServiceUpdateReportTemplate({
      reportTemplateName: `organizations/${organizationId}/reportTemplates/${id}`,
      reportTemplate: { display_name: input.name, template: input.template },
    }).pipe(map(mapApiReportTemplate));
  }
}
