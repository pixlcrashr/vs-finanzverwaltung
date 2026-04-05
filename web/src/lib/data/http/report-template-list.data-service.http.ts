import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import {
  listReportTemplates,
  deleteReportTemplate,
} from '../../api/functions';
import { ReportTemplate } from '../../../app/shared/models';
import { ReportTemplateListDataService } from '../../../app/routes/report-templates/report-template-list/report-template-list.data-service';
import { mapApiReportTemplate } from './_mappers';

@Injectable()
export class HttpReportTemplateListDataService extends ReportTemplateListDataService {
  private readonly api = inject(Api);

  getTemplates(): Observable<ReportTemplate[]> {
    return from(
      this.api.invoke(listReportTemplates, { pageSize: 100 }),
    ).pipe(map((resp) => (resp.reportTemplates ?? []).map(mapApiReportTemplate)));
  }

  deleteTemplate(id: string): Observable<void> {
    return from(
      this.api.invoke(deleteReportTemplate, { reportTemplateId: id }),
    ).pipe(map(() => undefined));
  }
}
