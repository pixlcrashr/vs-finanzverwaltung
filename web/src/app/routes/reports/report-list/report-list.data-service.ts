import { Observable } from 'rxjs';
import { Report, ReportTemplate } from '../../../shared/models';

export abstract class ReportListDataService {
  abstract listReports(organizationId: string): Observable<Report[]>;
  abstract listTemplates(organizationId: string): Observable<ReportTemplate[]>;
  abstract generateReport(organizationId: string, templateId: string, name: string): Observable<Report>;
  abstract deleteReport(organizationId: string, id: string): Observable<void>;
}
