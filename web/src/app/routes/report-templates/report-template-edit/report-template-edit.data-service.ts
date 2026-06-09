import { Observable } from 'rxjs';
import { ReportTemplate } from '../../../shared/models';

export interface UpdateTemplateInput {
  name: string;
  description: string;
  template: string;
}

export abstract class ReportTemplateEditDataService {
  abstract getTemplate(organizationId: string, id: string): Observable<ReportTemplate>;
  abstract updateTemplate(organizationId: string, id: string, input: UpdateTemplateInput): Observable<ReportTemplate>;
}
