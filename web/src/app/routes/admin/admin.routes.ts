import { Routes } from '@angular/router';
import { UserListDataService } from './users/user-list.data-service';
import { UserEditDataService } from './users/user-edit.data-service';
import { GroupListDataService } from './groups/group-list.data-service';
import { GroupNewDataService } from './groups/group-new.data-service';
import { GroupEditDataService } from './groups/group-edit.data-service';
import { OrganizationListDataService } from './organizations/organization-list.data-service';
import { OrganizationEditDataService } from './organizations/organization-edit.data-service';
import { environment } from '../../../environments/environment';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'users',
    loadComponent: () => import('./users/user-list.component').then((m) => m.UserListComponent),
    providers: [
      { provide: UserListDataService, useClass: environment.dataServices.userList },
    ],
  },
  {
    path: 'users/:id/edit',
    loadComponent: () => import('./users/user-edit.component').then((m) => m.UserEditComponent),
    providers: [
      { provide: UserEditDataService, useClass: environment.dataServices.userEdit },
    ],
  },
  {
    path: 'groups',
    loadComponent: () => import('./groups/group-list.component').then((m) => m.GroupListComponent),
    providers: [
      { provide: GroupListDataService, useClass: environment.dataServices.groupList },
    ],
  },
  {
    path: 'groups/new',
    loadComponent: () => import('./groups/group-new.component').then((m) => m.GroupNewComponent),
    providers: [
      { provide: GroupNewDataService, useClass: environment.dataServices.groupNew },
    ],
  },
  {
    path: 'groups/:id/edit',
    loadComponent: () => import('./groups/group-edit.component').then((m) => m.GroupEditComponent),
    providers: [
      { provide: GroupEditDataService, useClass: environment.dataServices.groupEdit },
    ],
  },
  {
    path: 'organizations',
    loadComponent: () =>
      import('./organizations/organization-list.component').then(
        (m) => m.OrganizationListComponent
      ),
    providers: [
      { provide: OrganizationListDataService, useClass: environment.dataServices.organizationList },
    ],
  },
  {
    path: 'organizations/:id/edit',
    loadComponent: () =>
      import('./organizations/organization-edit.component').then(
        (m) => m.OrganizationEditComponent
      ),
    providers: [
      { provide: OrganizationEditDataService, useClass: environment.dataServices.organizationEdit },
    ],
  },
];
