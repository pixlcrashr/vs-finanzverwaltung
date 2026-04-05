import { Routes } from '@angular/router';
import { SettingsDataService } from './settings/settings.data-service';
import { UserListDataService } from './users/user-list.data-service';
import { UserEditDataService } from './users/user-edit.data-service';
import { GroupListDataService } from './groups/group-list.data-service';
import { GroupNewDataService } from './groups/group-new.data-service';
import { GroupEditDataService } from './groups/group-edit.data-service';
import { ImportSourceListDataService } from './import-sources/import-source-list.data-service';
import { ImportSourceEditDataService } from './import-sources/import-source-edit.data-service';
import { ClosePeriodDialogDataService } from '../../shared/dialogs/close-period-dialog/close-period-dialog.data-service';
import { environment } from '../../../environments/environment';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/settings.component').then((m) => m.SettingsComponent),
    providers: [
      { provide: SettingsDataService, useClass: environment.dataServices.settings },
    ],
  },
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
    path: 'importSources',
    loadComponent: () =>
      import('./import-sources/import-source-list.component').then(
        (m) => m.ImportSourceListComponent
      ),
    providers: [
      { provide: ImportSourceListDataService, useClass: environment.dataServices.importSourceList },
    ],
  },
  {
    path: 'importSources/:id/edit',
    loadComponent: () =>
      import('./import-sources/import-source-edit.component').then(
        (m) => m.ImportSourceEditComponent
      ),
    providers: [
      { provide: ImportSourceEditDataService, useClass: environment.dataServices.importSourceEdit },
      { provide: ClosePeriodDialogDataService, useClass: environment.dataServices.closePeriodDialog },
    ],
  },
];
