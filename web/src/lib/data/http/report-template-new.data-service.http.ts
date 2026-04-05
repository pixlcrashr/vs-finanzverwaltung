import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import { createReportTemplate } from '../../api/functions';
import { ReportTemplate } from '../../../app/shared/models';
import {
  ReportTemplateNewDataService,
  CreateTemplateInput,
} from '../../../app/routes/report-templates/report-template-new/report-template-new.data-service';
import { mapApiReportTemplate } from './_mappers';

@Injectable()
export class HttpReportTemplateNewDataService extends ReportTemplateNewDataService {
  private readonly api = inject(Api);

  createTemplate(input: CreateTemplateInput): Observable<ReportTemplate> {
    return from(
      this.api.invoke(createReportTemplate, {
        body: { displayName: input.name, template: input.template },
      }),
    ).pipe(map(mapApiReportTemplate));
  }
}
