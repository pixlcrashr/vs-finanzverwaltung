import { Observable } from 'rxjs';
import { ReportTemplate } from '../../../shared/models';

export interface UpdateTemplateInput {
  name: string;
  description: string;
  template: string;
}

export abstract class ReportTemplateEditDataService {
  abstract getTemplate(id: string): Observable<ReportTemplate>;
  abstract updateTemplate(id: string, input: UpdateTemplateInput): Observable<ReportTemplate>;
}
