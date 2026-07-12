import { Routes } from '@angular/router';
import { ReimbursementListDataService } from './reimbursement-list/reimbursement-list.data-service';
import { ReimbursementEditDataService } from './reimbursement-edit/reimbursement-edit.data-service';
import { ReimbursementNewDataService } from './reimbursement-new/reimbursement-new.data-service';
import { environment } from '../../../environments/environment';
import { requireAllPermissions, requireAnyPermission } from '../../../lib/authz/permission.guard';
import { V1Permission } from '../../../lib/api/models';
import { resolvePermissions } from '../../../lib/authz/permission.resolver';

export const REIMBURSEMENTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [requireAnyPermission(
      V1Permission.PERMISSION_REIMBURSEMENTS_READ,
      V1Permission.PERMISSION_REIMBURSEMENTS_READ_OWN
    )],
    resolve: {
      permissions: resolvePermissions(
        V1Permission.PERMISSION_REIMBURSEMENTS_READ,
        V1Permission.PERMISSION_REIMBURSEMENTS_READ_OWN
      ),
    },
    loadComponent: () =>
      import('./reimbursement-list/reimbursement-list.component').then(
        (m) => m.ReimbursementListComponent
      ),
    providers: [
      {
        provide: ReimbursementListDataService,
        useClass: environment.dataServices.reimbursementList,
      },
    ],
  },
  {
    path: 'new',
    canActivate: [requireAllPermissions(V1Permission.PERMISSION_REIMBURSEMENTS_CREATE)],
    loadComponent: () =>
      import('./reimbursement-new/reimbursement-new.component').then(
        (m) => m.ReimbursementNewComponent
      ),
    providers: [
      {
        provide: ReimbursementNewDataService,
        useClass: environment.dataServices.reimbursementNew,
      },
    ],
  },
  {
    path: ':id',
    canActivate: [requireAnyPermission(
      V1Permission.PERMISSION_REIMBURSEMENTS_READ,
      V1Permission.PERMISSION_REIMBURSEMENTS_READ_OWN
    )],
    resolve: {
      permissions: resolvePermissions(
        V1Permission.PERMISSION_REIMBURSEMENTS_READ,
        V1Permission.PERMISSION_REIMBURSEMENTS_READ_OWN
      ),
    },
    loadComponent: () =>
      import('./reimbursement-edit/reimbursement-edit.component').then(
        (m) => m.ReimbursementEditComponent
      ),
    providers: [
      {
        provide: ReimbursementEditDataService,
        useClass: environment.dataServices.reimbursementEdit,
      },
    ],
  },
];
