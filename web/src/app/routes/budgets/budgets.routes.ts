import { Routes } from '@angular/router';
import { BudgetListDataService } from './budget-list/budget-list.data-service';
import { MockBudgetListDataService } from '../../../lib/data/mock/budget-list.data-service.mock';
import { BudgetEditDataService } from './budget-edit/budget-edit.data-service';
import { MockBudgetEditDataService } from '../../../lib/data/mock/budget-edit.data-service.mock';

export const BUDGETS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./budget-list/budget-list.component').then((m) => m.BudgetListComponent),
    providers: [{ provide: BudgetListDataService, useClass: MockBudgetListDataService }],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./budget-edit/budget-edit.component').then((m) => m.BudgetEditComponent),
    providers: [{ provide: BudgetEditDataService, useClass: MockBudgetEditDataService }],
  },
];
