import { Routes } from '@angular/router';
import { ReimbursementListDataService } from './reimbursement-list/reimbursement-list.data-service';
import { ReimbursementEditDataService } from './reimbursement-edit/reimbursement-edit.data-service';
import { ReimbursementNewDataService } from './reimbursement-new/reimbursement-new.data-service';
import { environment } from '../../../environments/environment';

export const REIMBURSEMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./reimbursement-list/reimbursement-list.component').then(
        (m) => m.ReimbursementListComponent
      ),
    providers: [
      {
        provide: ReimbursementListDataService,
        useClass: environment.dataServices.reimbursementList,
      },
    ],
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./reimbursement-new/reimbursement-new.component').then(
        (m) => m.ReimbursementNewComponent
      ),
    providers: [
      {
        provide: ReimbursementNewDataService,
        useClass: environment.dataServices.reimbursementNew,
      },
    ],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./reimbursement-edit/reimbursement-edit.component').then(
        (m) => m.ReimbursementEditComponent
      ),
    providers: [
      {
        provide: ReimbursementEditDataService,
        useClass: environment.dataServices.reimbursementEdit,
      },
    ],
  },
];
