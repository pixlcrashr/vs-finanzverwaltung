import { Observable } from 'rxjs';
import { ReportTemplate } from '../../../shared/models';

export abstract class ReportTemplateListDataService {
  abstract listTemplates(organizationId: string): Observable<ReportTemplate[]>;
  abstract deleteTemplate(organizationId: string, id: string): Observable<void>;
}
