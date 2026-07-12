import { Routes } from '@angular/router';
import { TransactionEditDataService } from './transaction-edit/transaction-edit.data-service';
import { environment } from '../../../environments/environment';
import { requireAnyPermission } from '../../../lib/authz/permission.guard';
import { V1Permission } from '../../../lib/api/models';
import { resolvePermissions } from '../../../lib/authz/permission.resolver';

export const TRANSACTIONS_ROUTES: Routes = [
  {
    path: ':id',
    canActivate: [requireAnyPermission(V1Permission.PERMISSION_TRANSACTIONS_READ, V1Permission.PERMISSION_TRANSACTIONS_UPDATE)],
    resolve: {
      permissions: resolvePermissions(V1Permission.PERMISSION_TRANSACTIONS_UPDATE, V1Permission.PERMISSION_TRANSACTIONS_DELETE),
    },
    loadComponent: () =>
      import('./transaction-edit/transaction-edit.component').then(
        (m) => m.TransactionEditComponent
      ),
    providers: [{ provide: TransactionEditDataService, useClass: environment.dataServices.transactionEdit }],
  },
];
