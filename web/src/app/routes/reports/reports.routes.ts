import { Routes } from '@angular/router';
import { ReportListDataService } from './report-list/report-list.data-service';
import { ReportViewDataService } from './report-view/report-view.data-service';
import { CreateReportDialogDataService } from '../../shared/dialogs/create-report-dialog/create-report-dialog.data-service';
import { environment } from '../../../environments/environment';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./report-list/report-list.component').then((m) => m.ReportListComponent),
    providers: [
      { provide: ReportListDataService, useClass: environment.dataServices.reportList },
      { provide: CreateReportDialogDataService, useClass: environment.dataServices.createReportDialog },
    ],
  },
  {
    path: ':id/view',
    loadComponent: () =>
      import('./report-view/report-view.component').then((m) => m.ReportViewComponent),
    providers: [{ provide: ReportViewDataService, useClass: environment.dataServices.reportView }],
  },
];
