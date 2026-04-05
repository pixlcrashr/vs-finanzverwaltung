import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import { getReport, downloadReport } from '../../api/functions';
import {
  ReportViewDataService,
  ReportContent,
} from '../../../app/routes/reports/report-view/report-view.data-service';
import { mapApiReport } from './_mappers';

@Injectable()
export class HttpReportViewDataService extends ReportViewDataService {
  private readonly api = inject(Api);

  getReport(id: string): Observable<ReportContent> {
    return from(this.api.invoke(getReport, { reportId: id })).pipe(
      map((r) => ({
        report: mapApiReport(r),
        htmlContent: '',
      })),
    );
  }

  downloadPdf(id: string): Observable<Blob> {
    return from(this.api.invoke(downloadReport, { reportId: id })).pipe(
      map((resp) => {
        const byteChars = atob(resp.data);
        const byteNums = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNums[i] = byteChars.charCodeAt(i);
        }
        return new Blob([new Uint8Array(byteNums)], { type: 'application/pdf' });
      }),
    );
  }
}
