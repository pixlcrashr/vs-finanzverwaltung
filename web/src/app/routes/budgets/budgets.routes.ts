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

export const BUDGETS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./budget-list/budget-list.component').then((m) => m.BudgetListComponent),
    providers: [
      { provide: BudgetListDataService, useClass: environment.dataServices.budgetList },
      { provide: CreateBudgetDialogDataService, useClass: environment.dataServices.createBudgetDialog },
    ],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./budget-edit/budget-edit.component').then((m) => m.BudgetEditComponent),
    providers: [
      { provide: BudgetEditDataService, useClass: environment.dataServices.budgetEdit },
      { provide: CloseBudgetDialogDataService, useClass: environment.dataServices.closeBudgetDialog },
    ],
  },
];
