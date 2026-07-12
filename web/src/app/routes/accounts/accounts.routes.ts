import { Routes, UrlSegment } from '@angular/router';
import { AccountListDataService } from './account-list/account-list.data-service';
import { AccountEditDataService } from './account-edit/account-edit.data-service';
import { AccountCompareDataService } from './account-compare/account-compare.data-service';
import { CreateAccountDialogDataService } from '../../shared/dialogs/create-account-dialog/create-account-dialog.data-service';
import { environment } from '../../../environments/environment';
import { requireAllPermissions, requireAnyPermission } from '../../../lib/authz/permission.guard';
import { V1Permission } from '../../../lib/api/models';
import { resolvePermissions } from '../../../lib/authz/permission.resolver';

export const ACCOUNTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [requireAllPermissions(V1Permission.PERMISSION_ACCOUNTS_READ)],
    resolve: {
      permissions: resolvePermissions(V1Permission.PERMISSION_ACCOUNTS_CREATE, V1Permission.PERMISSION_ACCOUNTS_UPDATE, V1Permission.PERMISSION_ACCOUNTS_DELETE, V1Permission.PERMISSION_ACCOUNTS_ARCHIVE)
    },
    loadComponent: () =>
      import('./account-list/account-list.component').then((m) => m.AccountListComponent),
    providers: [
      { provide: AccountListDataService, useClass: environment.dataServices.accountList },
      { provide: CreateAccountDialogDataService, useClass: environment.dataServices.createAccountDialog },
    ],
  },
  {
    path: 'compare',
    canActivate: [requireAllPermissions(V1Permission.PERMISSION_ACCOUNTS_READ)],
    loadComponent: () =>
      import('./account-compare/account-compare.component').then((m) => m.AccountCompareComponent),
    providers: [{ provide: AccountCompareDataService, useClass: environment.dataServices.accountCompare }],
  },
  {
    path: ':id',
    canActivate: [requireAnyPermission(V1Permission.PERMISSION_ACCOUNTS_READ, V1Permission.PERMISSION_ACCOUNTS_UPDATE)],
    resolve: {
      permissions: resolvePermissions(V1Permission.PERMISSION_ACCOUNTS_UPDATE, V1Permission.PERMISSION_ACCOUNTS_DELETE)
    },
    loadComponent: () =>
      import('./account-edit/account-edit.component').then((m) => m.AccountEditComponent),
    providers: [{ provide: AccountEditDataService, useClass: environment.dataServices.accountEdit }],
  },
];
