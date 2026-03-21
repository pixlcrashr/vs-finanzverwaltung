import { Observable } from 'rxjs';
import { ReportTemplate } from '../../../shared/models';

export abstract class ReportTemplateListDataService {
  abstract getTemplates(): Observable<ReportTemplate[]>;
  abstract deleteTemplate(id: string): Observable<void>;
}
