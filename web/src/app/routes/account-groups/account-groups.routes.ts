import { Routes } from '@angular/router';
import { AccountGroupListDataService } from './account-group-list/account-group-list.data-service';
import { MockAccountGroupListDataService } from '../../../lib/data/mock/account-group-list.data-service.mock';
import { AccountGroupViewDataService } from './account-group-view/account-group-view.data-service';
import { MockAccountGroupViewDataService } from '../../../lib/data/mock/account-group-view.data-service.mock';
import { AccountGroupEditDataService } from './account-group-edit/account-group-edit.data-service';
import { MockAccountGroupEditDataService } from '../../../lib/data/mock/account-group-edit.data-service.mock';

export const ACCOUNT_GROUPS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./account-group-list/account-group-list.component').then(
        (m) => m.AccountGroupListComponent
      ),
    providers: [{ provide: AccountGroupListDataService, useClass: MockAccountGroupListDataService }],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./account-group-view/account-group-view.component').then(
        (m) => m.AccountGroupViewComponent
      ),
    providers: [{ provide: AccountGroupViewDataService, useClass: MockAccountGroupViewDataService }],
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./account-group-edit/account-group-edit.component').then(
        (m) => m.AccountGroupEditComponent
      ),
    providers: [{ provide: AccountGroupEditDataService, useClass: MockAccountGroupEditDataService }],
  },
];
