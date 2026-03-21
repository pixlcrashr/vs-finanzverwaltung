import { Routes, UrlSegment } from '@angular/router';
import { AccountListDataService } from './account-list/account-list.data-service';
import { MockAccountListDataService } from '../../../lib/data/mock/account-list.data-service.mock';
import { AccountEditDataService } from './account-edit/account-edit.data-service';
import { MockAccountEditDataService } from '../../../lib/data/mock/account-edit.data-service.mock';
import { AccountCompareDataService } from './account-compare/account-compare.data-service';
import { MockAccountCompareDataService } from '../../../lib/data/mock/account-compare.data-service.mock';

export const ACCOUNTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./account-list/account-list.component').then((m) => m.AccountListComponent),
    providers: [{ provide: AccountListDataService, useClass: MockAccountListDataService }],
  },
  {
    path: 'compare',
    loadComponent: () =>
      import('./account-compare/account-compare.component').then((m) => m.AccountCompareComponent),
    providers: [{ provide: AccountCompareDataService, useClass: MockAccountCompareDataService }],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./account-edit/account-edit.component').then((m) => m.AccountEditComponent),
    providers: [{ provide: AccountEditDataService, useClass: MockAccountEditDataService }],
  },
];
