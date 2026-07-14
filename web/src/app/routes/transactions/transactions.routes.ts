import { Routes } from '@angular/router';
import { TransactionEditDataService } from './transaction-edit/transaction-edit.data-service';
import { environment } from '../../../environments/environment';
import { requireAnyPermission } from '../../../lib/authz/permission.guard';
import { Permission, Permissions } from '../../../lib/authz/permissions';
import { resolvePermissions } from '../../../lib/authz/permission.resolver';

export const TRANSACTIONS_ROUTES: Routes = [
  {
    path: ':id',
    canActivate: [requireAnyPermission(Permissions.TRANSACTIONS_READ, Permissions.TRANSACTIONS_UPDATE)],
    resolve: {
      permissions: resolvePermissions(Permissions.TRANSACTIONS_UPDATE, Permissions.TRANSACTIONS_DELETE),
    },
    loadComponent: () =>
      import('./transaction-edit/transaction-edit.component').then(
        (m) => m.TransactionEditComponent
      ),
    providers: [{ provide: TransactionEditDataService, useClass: environment.dataServices.transactionEdit }],
  },
];
