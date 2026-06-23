import { Routes } from '@angular/router';
import { LedgerAccountListDataService } from './ledger-accounts/ledger-account-list.data-service';
import { LedgerAccountEditDataService } from './ledger-accounts/ledger-account-edit.data-service';
import { LedgerYearListDataService } from './ledger-years/ledger-year-list.data-service';
import { environment } from '../../../environments/environment';

export const LEDGER_ROUTES: Routes = [
  {
    path: 'ledgerAccounts',
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
    loadComponent: () =>
      import('./ledger-years/ledger-year-list.component').then(
        (m) => m.LedgerYearListComponent
      ),
    providers: [
      { provide: LedgerYearListDataService, useClass: environment.dataServices.ledgerYearList },
    ],
  },
];
