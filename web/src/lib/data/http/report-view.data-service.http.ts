import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { ReportServiceService } from '../../api/services/report-service.service';
import {
  ReportViewDataService,
  ReportContent,
} from '../../../app/routes/reports/report-view/report-view.data-service';
import { mapApiReport } from './_mappers';

@Injectable()
export class HttpReportViewDataService extends ReportViewDataService {
  private readonly svc = inject(ReportServiceService);

  getReport(organizationId: string, id: string): Observable<ReportContent> {
    return this.svc.ReportServiceGetReport(`organizations/${organizationId}/reports/${id}`).pipe(
      map((r) => ({
        report: mapApiReport(r),
        htmlContent: '',
      })),
    );
  }

  downloadPdf(_organizationId: string, _id: string): Observable<Blob> {
    // TODO: File download is served via the Huma API only (GET .../reports/{id}:download)
    return throwError(() => new Error('PDF download is served via the Huma REST API, not gRPC-gateway.'));
  }
}
