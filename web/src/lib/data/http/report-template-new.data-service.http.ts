import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ReportTemplateServiceService } from '../../api/services/report-template-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { ReportTemplate } from '../../../app/shared/models';
import {
  ReportTemplateNewDataService,
  CreateTemplateInput,
} from '../../../app/routes/report-templates/report-template-new/report-template-new.data-service';
import { mapApiReportTemplate } from './_mappers';

@Injectable()
export class HttpReportTemplateNewDataService extends ReportTemplateNewDataService {
  private readonly svc = inject(ReportTemplateServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  createTemplate(input: CreateTemplateInput): Observable<ReportTemplate> {
    const parent = `organizations/${this.orgSvc.currentOrganization()!.id}`;
    return this.svc.ReportTemplateServiceCreateReportTemplate({
      parent,
      reportTemplate: { display_name: input.name, template: input.template },
    }).pipe(map(mapApiReportTemplate));
  }
}
