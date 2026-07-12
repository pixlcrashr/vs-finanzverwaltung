import { Routes } from '@angular/router';
import { AccountGroupListDataService } from './account-group-list/account-group-list.data-service';
import { AccountGroupStatsDataService } from './account-group-stats/account-group-stats.data-service';
import { AccountGroupEditDataService } from './account-group-edit/account-group-edit.data-service';
import {
  CreateAccountGroupDialogDataService,
} from '../../shared/dialogs/create-account-group-dialog/create-account-group-dialog.data-service';
import {
  AddAccountToGroupDialogDataService,
} from '../../shared/dialogs/add-account-to-group-dialog/add-account-to-group-dialog.data-service';
import { environment } from '../../../environments/environment';
import { requireAllPermissions, requireAnyPermission } from '../../../lib/authz/permission.guard';
import { V1Permission } from '../../../lib/api/models';

export const ACCOUNT_GROUPS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [requireAllPermissions(V1Permission.PERMISSION_ACCOUNTS_READ, V1Permission.PERMISSION_ACCOUNT_GROUPS_READ)],
    loadComponent: () =>
      import('./account-group-list/account-group-list.component').then(
        (m) => m.AccountGroupListComponent
      ),
    providers: [
      { provide: AccountGroupListDataService, useClass: environment.dataServices.accountGroupList },
      { provide: CreateAccountGroupDialogDataService, useClass: environment.dataServices.createAccountGroupDialog },
    ],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./account-group-edit/account-group-edit.component').then(
        (m) => m.AccountGroupEditComponent
      ),
    providers: [
      { provide: AccountGroupEditDataService, useClass: environment.dataServices.accountGroupEdit },
      { provide: AddAccountToGroupDialogDataService, useClass: environment.dataServices.addAccountToGroupDialog },
    ],
  },
  {
    path: ':id/stats',
    loadComponent: () =>
      import('./account-group-stats/account-group-stats.component').then(
        (m) => m.AccountGroupStatsComponent
      ),
    providers: [{ provide: AccountGroupStatsDataService, useClass: environment.dataServices.accountGroupStats }],
  },
];
