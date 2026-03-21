import { Observable } from 'rxjs';
import { Report } from '../../../shared/models';

export interface ReportContent {
  report: Report;
  htmlContent: string;
}

export abstract class ReportViewDataService {
  abstract getReport(id: string): Observable<ReportContent>;
  abstract downloadPdf(id: string): Observable<Blob>;
}
