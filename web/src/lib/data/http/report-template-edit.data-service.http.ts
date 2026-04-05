import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import {
  getReportTemplate,
  updateReportTemplate,
} from '../../api/functions';
import { ReportTemplate } from '../../../app/shared/models';
import {
  ReportTemplateEditDataService,
  UpdateTemplateInput,
} from '../../../app/routes/report-templates/report-template-edit/report-template-edit.data-service';
import { mapApiReportTemplate } from './_mappers';

@Injectable()
export class HttpReportTemplateEditDataService extends ReportTemplateEditDataService {
  private readonly api = inject(Api);

  getTemplate(id: string): Observable<ReportTemplate> {
    return from(
      this.api.invoke(getReportTemplate, { reportTemplateId: id }),
    ).pipe(map(mapApiReportTemplate));
  }

  updateTemplate(id: string, input: UpdateTemplateInput): Observable<ReportTemplate> {
    return from(
      this.api.invoke(updateReportTemplate, {
        reportTemplateId: id,
        body: { displayName: input.name, template: input.template },
      }),
    ).pipe(map(mapApiReportTemplate));
  }
}
