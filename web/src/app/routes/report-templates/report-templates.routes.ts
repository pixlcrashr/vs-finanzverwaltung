import { Routes } from '@angular/router';
import { ReportTemplateListDataService } from './report-template-list/report-template-list.data-service';
import { ReportTemplateNewDataService } from './report-template-new/report-template-new.data-service';
import { ReportTemplateEditDataService } from './report-template-edit/report-template-edit.data-service';
import { environment } from '../../../environments/environment';
import { requireAllPermissions, requireAnyPermission } from '../../../lib/authz/permission.guard';
import { V1Permission } from '../../../lib/api/models';
import { resolvePermissions } from '../../../lib/authz/permission.resolver';

export const REPORT_TEMPLATES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [requireAllPermissions(V1Permission.PERMISSION_REPORT_TEMPLATES_READ)],
    resolve: {
      permissions: resolvePermissions(V1Permission.PERMISSION_REPORT_TEMPLATES_CREATE, V1Permission.PERMISSION_REPORT_TEMPLATES_DELETE),
    },
    loadComponent: () =>
      import('./report-template-list/report-template-list.component').then(
        (m) => m.ReportTemplateListComponent
      ),
    providers: [{ provide: ReportTemplateListDataService, useClass: environment.dataServices.reportTemplateList }],
  },
  {
    path: 'new',
    canActivate: [requireAllPermissions(V1Permission.PERMISSION_REPORT_TEMPLATES_CREATE)],
    loadComponent: () =>
      import('./report-template-new/report-template-new.component').then(
        (m) => m.ReportTemplateNewComponent
      ),
    providers: [{ provide: ReportTemplateNewDataService, useClass: environment.dataServices.reportTemplateNew }],
  },
  {
    path: ':id/edit',
    canActivate: [requireAnyPermission(V1Permission.PERMISSION_REPORT_TEMPLATES_READ, V1Permission.PERMISSION_REPORT_TEMPLATES_UPDATE)],
    resolve: {
      permissions: resolvePermissions(V1Permission.PERMISSION_REPORT_TEMPLATES_UPDATE, V1Permission.PERMISSION_REPORT_TEMPLATES_DELETE),
    },
    loadComponent: () =>
      import('./report-template-edit/report-template-edit.component').then(
        (m) => m.ReportTemplateEditComponent
      ),
    providers: [{ provide: ReportTemplateEditDataService, useClass: environment.dataServices.reportTemplateEdit }],
  },
];
