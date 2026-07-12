import { Routes } from '@angular/router';
import { BudgetListDataService } from './budget-list/budget-list.data-service';
import { BudgetEditDataService } from './budget-edit/budget-edit.data-service';
import {
  CreateBudgetDialogDataService
} from '../../shared/dialogs/create-budget-dialog/create-budget-dialog.data-service';
import {
  CloseBudgetDialogDataService,
} from '../../shared/dialogs/close-budget-dialog/close-budget-dialog.data-service';
import { environment } from '../../../environments/environment';
import { requireAllPermissions } from '../../../lib/authz/permission.guard';
import { V1Permission } from '../../../lib/api/models';
import { resolvePermissions } from '../../../lib/authz/permission.resolver';

export const BUDGETS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [requireAllPermissions(V1Permission.PERMISSION_BUDGETS_READ)],
    resolve: {
      permissions: resolvePermissions(
        V1Permission.PERMISSION_BUDGETS_CREATE,
        V1Permission.PERMISSION_BUDGETS_UPDATE,
        V1Permission.PERMISSION_BUDGETS_DELETE
      ),
    },
    loadComponent: () =>
      import('./budget-list/budget-list.component').then((m) => m.BudgetListComponent),
    providers: [
      { provide: BudgetListDataService, useClass: environment.dataServices.budgetList },
      { provide: CreateBudgetDialogDataService, useClass: environment.dataServices.createBudgetDialog },
    ],
  },
  {
    path: ':id',
    canActivate: [requireAllPermissions(V1Permission.PERMISSION_BUDGETS_READ)],
    resolve: {
      permissions: resolvePermissions(
        V1Permission.PERMISSION_BUDGETS_CREATE,
        V1Permission.PERMISSION_BUDGETS_UPDATE,
        V1Permission.PERMISSION_BUDGETS_DELETE
      ),
    },
    loadComponent: () =>
      import('./budget-edit/budget-edit.component').then((m) => m.BudgetEditComponent),
    providers: [
      { provide: BudgetEditDataService, useClass: environment.dataServices.budgetEdit },
      { provide: CloseBudgetDialogDataService, useClass: environment.dataServices.closeBudgetDialog },
    ],
  },
];
