import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { ReportServiceService } from '../../api/services/report-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import {
  ReportViewDataService,
  ReportContent,
} from '../../../app/routes/reports/report-view/report-view.data-service';
import { mapApiReport } from './_mappers';

@Injectable()
export class HttpReportViewDataService extends ReportViewDataService {
  private readonly svc = inject(ReportServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private reportName(id: string): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}/reports/${id}`;
  }

  getReport(id: string): Observable<ReportContent> {
    return this.svc.ReportServiceGetReport(this.reportName(id)).pipe(
      map((r) => ({
        report: mapApiReport(r),
        htmlContent: '',
      })),
    );
  }

  downloadPdf(_id: string): Observable<Blob> {
    // TODO: File download is served via the Huma API only (GET .../reports/{id}:download)
    return throwError(() => new Error('PDF download is served via the Huma REST API, not gRPC-gateway.'));
  }
}
