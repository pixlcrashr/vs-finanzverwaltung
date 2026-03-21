import { Routes } from '@angular/router';
import { ReportListDataService } from './report-list/report-list.data-service';
import { MockReportListDataService } from '../../../lib/data/mock/report-list.data-service.mock';
import { ReportViewDataService } from './report-view/report-view.data-service';
import { MockReportViewDataService } from '../../../lib/data/mock/report-view.data-service.mock';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./report-list/report-list.component').then((m) => m.ReportListComponent),
    providers: [{ provide: ReportListDataService, useClass: MockReportListDataService }],
  },
  {
    path: ':id/view',
    loadComponent: () =>
      import('./report-view/report-view.component').then((m) => m.ReportViewComponent),
    providers: [{ provide: ReportViewDataService, useClass: MockReportViewDataService }],
  },
];
