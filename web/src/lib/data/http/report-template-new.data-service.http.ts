import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ReportTemplateServiceService } from '../../api/services/report-template-service.service';
import { ReportTemplate } from '../../../app/shared/models';
import { ReportTemplateNewDataService } from '../../../app/routes/report-templates/report-template-new/report-template-new.data-service';
import { mapApiReportTemplate } from './_mappers';

@Injectable()
export class HttpReportTemplateNewDataService extends ReportTemplateNewDataService {
  private readonly svc = inject(ReportTemplateServiceService);

  createTemplate(organizationId: string, name: string, description: string, template: string): Observable<ReportTemplate> {
    return this.svc.ReportTemplateServiceCreateReportTemplate({
      parent: `organizations/${organizationId}`,
      reportTemplate: { display_name: name, template },
    }).pipe(map(mapApiReportTemplate));
  }
}
