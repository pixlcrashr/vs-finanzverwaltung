import { Routes } from '@angular/router';
import { LedgerYearListDataService } from './ledger-years/ledger-year-list.data-service';
import { environment } from '../../../environments/environment';
import { requireAllPermissions } from '../../../lib/authz/permission.guard';
import { Permission, Permissions } from '../../../lib/authz/permissions';
import { resolvePermissions } from '../../../lib/authz/permission.resolver';

export const LEDGER_YEAR_ROUTES: Routes = [
  {
    path: '',
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
