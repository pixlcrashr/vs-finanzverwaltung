import { Observable } from 'rxjs';
import { CreatedReport, ReportTemplateOption } from './create-report-dialog.component';

export abstract class CreateReportDialogDataService {
  abstract listTemplates(organizationId: string): Observable<ReportTemplateOption[]>;
  abstract generateReport(organizationId: string, templateId: string, name: string): Observable<CreatedReport>;
}
