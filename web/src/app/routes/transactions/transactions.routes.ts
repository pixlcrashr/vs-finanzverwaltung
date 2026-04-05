import { Routes } from '@angular/router';
import { TransactionEditDataService } from './transaction-edit/transaction-edit.data-service';
import { environment } from '../../../environments/environment';

export const TRANSACTIONS_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('./transaction-edit/transaction-edit.component').then(
        (m) => m.TransactionEditComponent
      ),
    providers: [{ provide: TransactionEditDataService, useClass: environment.dataServices.transactionEdit }],
  },
];
