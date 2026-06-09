import { Observable } from 'rxjs';
import { ReportTemplate } from '../../../shared/models';



export abstract class ReportTemplateNewDataService {
  abstract createTemplate(organizationId: string, name: string, description: string, template: string): Observable<ReportTemplate>;
}
