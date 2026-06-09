import { Observable } from 'rxjs';
import { Report } from '../../../shared/models';

export interface ReportContent {
  report: Report;
  htmlContent: string;
}

export abstract class ReportViewDataService {
  abstract getReport(organizationId: string, id: string): Observable<ReportContent>;
  abstract downloadPdf(organizationId: string, id: string): Observable<Blob>;
}
