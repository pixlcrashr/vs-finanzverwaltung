import { Routes } from '@angular/router';
import { SettingsDataService } from './settings/settings.data-service';
import { MockSettingsDataService } from '../../../lib/data/mock/settings.data-service.mock';
import { UserListDataService } from './users/user-list.data-service';
import { MockUserListDataService } from '../../../lib/data/mock/user-list.data-service.mock';
import { UserEditDataService } from './users/user-edit.data-service';
import { MockUserEditDataService } from '../../../lib/data/mock/user-edit.data-service.mock';
import { GroupListDataService } from './groups/group-list.data-service';
import { MockGroupListDataService } from '../../../lib/data/mock/group-list.data-service.mock';
import { GroupNewDataService } from './groups/group-new.data-service';
import { MockGroupNewDataService } from '../../../lib/data/mock/group-new.data-service.mock';
import { GroupEditDataService } from './groups/group-edit.data-service';
import { MockGroupEditDataService } from '../../../lib/data/mock/group-edit.data-service.mock';
import { ImportSourceListDataService } from './import-sources/import-source-list.data-service';
import { MockImportSourceListDataService } from '../../../lib/data/mock/import-source-list.data-service.mock';
import { ImportSourceEditDataService } from './import-sources/import-source-edit.data-service';
import { MockImportSourceEditDataService } from '../../../lib/data/mock/import-source-edit.data-service.mock';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/settings.component').then((m) => m.SettingsComponent),
    providers: [
      { provide: SettingsDataService, useClass: MockSettingsDataService },
    ],
  },
  {
    path: 'users',
    loadComponent: () => import('./users/user-list.component').then((m) => m.UserListComponent),
    providers: [
      { provide: UserListDataService, useClass: MockUserListDataService },
    ],
  },
  {
    path: 'users/:id/edit',
    loadComponent: () => import('./users/user-edit.component').then((m) => m.UserEditComponent),
    providers: [
      { provide: UserEditDataService, useClass: MockUserEditDataService },
    ],
  },
  {
    path: 'groups',
    loadComponent: () => import('./groups/group-list.component').then((m) => m.GroupListComponent),
    providers: [
      { provide: GroupListDataService, useClass: MockGroupListDataService },
    ],
  },
  {
    path: 'groups/new',
    loadComponent: () => import('./groups/group-new.component').then((m) => m.GroupNewComponent),
    providers: [
      { provide: GroupNewDataService, useClass: MockGroupNewDataService },
    ],
  },
  {
    path: 'groups/:id/edit',
    loadComponent: () => import('./groups/group-edit.component').then((m) => m.GroupEditComponent),
    providers: [
      { provide: GroupEditDataService, useClass: MockGroupEditDataService },
    ],
  },
  {
    path: 'import-sources',
    loadComponent: () =>
      import('./import-sources/import-source-list.component').then(
        (m) => m.ImportSourceListComponent
      ),
    providers: [
      { provide: ImportSourceListDataService, useClass: MockImportSourceListDataService },
    ],
  },
  {
    path: 'import-sources/:id/edit',
    loadComponent: () =>
      import('./import-sources/import-source-edit.component').then(
        (m) => m.ImportSourceEditComponent
      ),
    providers: [
      { provide: ImportSourceEditDataService, useClass: MockImportSourceEditDataService },
    ],
  },
];
