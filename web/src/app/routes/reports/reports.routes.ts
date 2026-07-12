import { Routes } from '@angular/router';
import { ReportListDataService } from './report-list/report-list.data-service';
import { ReportViewDataService } from './report-view/report-view.data-service';
import { CreateReportDialogDataService } from '../../shared/dialogs/create-report-dialog/create-report-dialog.data-service';
import { environment } from '../../../environments/environment';
import { requireAllPermissions } from '../../../lib/authz/permission.guard';
import { V1Permission } from '../../../lib/api/models';
import { resolvePermissions } from '../../../lib/authz/permission.resolver';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [requireAllPermissions(V1Permission.PERMISSION_REPORTS_READ)],
    resolve: {
      permissions: resolvePermissions(V1Permission.PERMISSION_REPORTS_CREATE, V1Permission.PERMISSION_REPORTS_DELETE),
    },
    loadComponent: () =>
      import('./report-list/report-list.component').then((m) => m.ReportListComponent),
    providers: [
      { provide: ReportListDataService, useClass: environment.dataServices.reportList },
      { provide: CreateReportDialogDataService, useClass: environment.dataServices.createReportDialog },
    ],
  },
  {
    path: ':id/view',
    canActivate: [requireAllPermissions(V1Permission.PERMISSION_REPORTS_READ)],
    loadComponent: () =>
      import('./report-view/report-view.component').then((m) => m.ReportViewComponent),
    providers: [{ provide: ReportViewDataService, useClass: environment.dataServices.reportView }],
  },
];
