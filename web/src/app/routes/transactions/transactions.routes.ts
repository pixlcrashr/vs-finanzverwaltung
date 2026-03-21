import { Routes } from '@angular/router';
import { TransactionEditDataService } from './transaction-edit/transaction-edit.data-service';
import { MockTransactionEditDataService } from '../../../lib/data/mock/transaction-edit.data-service.mock';

export const TRANSACTIONS_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('./transaction-edit/transaction-edit.component').then(
        (m) => m.TransactionEditComponent
      ),
    providers: [{ provide: TransactionEditDataService, useClass: MockTransactionEditDataService }],
  },
];
