import { Observable } from 'rxjs';
import { CreatedReport, ReportTemplateOption } from './create-report-dialog.component';

export abstract class CreateReportDialogDataService {
  abstract getTemplates(): Observable<ReportTemplateOption[]>;
  abstract generateReport(templateId: string, name: string): Observable<CreatedReport>;
}
