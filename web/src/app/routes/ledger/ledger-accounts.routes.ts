import { Routes } from '@angular/router';
import { LedgerAccountListDataService } from './ledger-accounts/ledger-account-list.data-service';
import { LedgerAccountEditDataService } from './ledger-accounts/ledger-account-edit.data-service';
import { environment } from '../../../environments/environment';
import { requireAllPermissions, requireAnyPermission } from '../../../lib/authz/permission.guard';
import { Permission, Permissions } from '../../../lib/authz/permissions';
import { resolvePermissions } from '../../../lib/authz/permission.resolver';

export const LEDGER_ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [requireAllPermissions(Permissions.LEDGER_ACCOUNT_READ)],
    resolve: {
      permissions: resolvePermissions(Permissions.LEDGER_ACCOUNT_UPDATE, Permissions.LEDGER_ACCOUNT_DELETE),
    },
    loadComponent: () =>
      import('./ledger-accounts/ledger-account-list.component').then(
        (m) => m.LedgerAccountListComponent
      ),
    providers: [
      { provide: LedgerAccountListDataService, useClass: environment.dataServices.ledgerAccountList },
    ],
  },
  {
    path: ':id/edit',
    canActivate: [requireAnyPermission(Permissions.LEDGER_ACCOUNT_READ, Permissions.LEDGER_ACCOUNT_UPDATE)],
    resolve: {
      permissions: resolvePermissions(Permissions.LEDGER_ACCOUNT_UPDATE, Permissions.LEDGER_ACCOUNT_DELETE),
    },
    loadComponent: () =>
      import('./ledger-accounts/ledger-account-edit.component').then(
        (m) => m.LedgerAccountEditComponent
      ),
    providers: [
      { provide: LedgerAccountEditDataService, useClass: environment.dataServices.ledgerAccountEdit },
    ],
  },
];
