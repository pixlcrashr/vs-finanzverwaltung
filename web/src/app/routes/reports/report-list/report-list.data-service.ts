import { Observable } from 'rxjs';
import { Report, ReportTemplate } from '../../../shared/models';

export abstract class ReportListDataService {
  abstract getReports(): Observable<Report[]>;
  abstract getTemplates(): Observable<ReportTemplate[]>;
  abstract generateReport(templateId: string, name: string): Observable<Report>;
  abstract deleteReport(id: string): Observable<void>;
}
