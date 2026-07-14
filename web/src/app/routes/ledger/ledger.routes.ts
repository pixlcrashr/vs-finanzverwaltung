import { Routes } from '@angular/router';
import { LedgerAccountListDataService } from './ledger-accounts/ledger-account-list.data-service';
import { LedgerAccountEditDataService } from './ledger-accounts/ledger-account-edit.data-service';
import { LedgerYearListDataService } from './ledger-years/ledger-year-list.data-service';
import { environment } from '../../../environments/environment';
import { requireAllPermissions, requireAnyPermission } from '../../../lib/authz/permission.guard';
import { Permission, Permissions } from '../../../lib/authz/permissions';
import { resolvePermissions } from '../../../lib/authz/permission.resolver';

export const LEDGER_ROUTES: Routes = [
  {
    path: 'ledgerAccounts',
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
    path: 'ledgerAccounts/:id/edit',
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
  {
    path: 'ledgerYears',
    canActivate: [requireAllPermissions(Permissions.LEDGER_YEAR_READ)],
    resolve: {
      permissions: resolvePermissions(Permissions.LEDGER_YEAR_CREATE, Permissions.LEDGER_YEAR_CLOSE, Permissions.LEDGER_YEAR_DELETE),
    },
    loadComponent: () =>
      import('./ledger-years/ledger-year-list.component').then(
        (m) => m.LedgerYearListComponent
      ),
    providers: [
      { provide: LedgerYearListDataService, useClass: environment.dataServices.ledgerYearList },
    ],
  },
];
