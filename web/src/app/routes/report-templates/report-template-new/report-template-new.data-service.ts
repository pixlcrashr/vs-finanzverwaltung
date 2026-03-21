import { Observable } from 'rxjs';
import { ReportTemplate } from '../../../shared/models';

export interface CreateTemplateInput {
  name: string;
  description: string;
  template: string;
}

export abstract class ReportTemplateNewDataService {
  abstract createTemplate(input: CreateTemplateInput): Observable<ReportTemplate>;
}
