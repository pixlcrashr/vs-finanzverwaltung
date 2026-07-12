import { Routes } from '@angular/router';
import { UserListDataService } from './users/user-list.data-service';
import { UserEditDataService } from './users/user-edit.data-service';
import { GroupListDataService } from './groups/group-list.data-service';
import { GroupNewDataService } from './groups/group-new.data-service';
import { GroupEditDataService } from './groups/group-edit.data-service';
import { OrganizationListDataService } from './organizations/organization-list.data-service';
import { OrganizationEditDataService } from './organizations/organization-edit.data-service';
import { environment } from '../../../environments/environment';
import { requireAllGlobalPermissions, requireAnyGlobalPermission } from '../../../lib/authz/permission.guard';
import { V1Permission } from '../../../lib/api/models';
import { resolveGlobalPermissions } from '../../../lib/authz/permission.resolver';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'users',
    canActivate: [requireAllGlobalPermissions(V1Permission.PERMISSION_USERS_READ)],
    resolve: {
      permissions: resolveGlobalPermissions(V1Permission.PERMISSION_USERS_UPDATE),
    },
    loadComponent: () => import('./users/user-list.component').then((m) => m.UserListComponent),
    providers: [
      { provide: UserListDataService, useClass: environment.dataServices.userList },
    ],
  },
  {
    path: 'users/:id/edit',
    canActivate: [requireAnyGlobalPermission(V1Permission.PERMISSION_USERS_READ, V1Permission.PERMISSION_USERS_UPDATE)],
    resolve: {
      permissions: resolveGlobalPermissions(V1Permission.PERMISSION_USERS_UPDATE),
    },
    loadComponent: () => import('./users/user-edit.component').then((m) => m.UserEditComponent),
    providers: [
      { provide: UserEditDataService, useClass: environment.dataServices.userEdit },
    ],
  },
  {
    path: 'groups',
    canActivate: [requireAllGlobalPermissions(V1Permission.PERMISSION_GROUPS_READ)],
    resolve: {
      permissions: resolveGlobalPermissions(V1Permission.PERMISSION_GROUPS_CREATE, V1Permission.PERMISSION_GROUPS_UPDATE, V1Permission.PERMISSION_GROUPS_DELETE),
    },
    loadComponent: () => import('./groups/group-list.component').then((m) => m.GroupListComponent),
    providers: [
      { provide: GroupListDataService, useClass: environment.dataServices.groupList },
    ],
  },
  {
    path: 'groups/new',
    canActivate: [requireAllGlobalPermissions(V1Permission.PERMISSION_GROUPS_CREATE)],
    loadComponent: () => import('./groups/group-new.component').then((m) => m.GroupNewComponent),
    providers: [
      { provide: GroupNewDataService, useClass: environment.dataServices.groupNew },
    ],
  },
  {
    path: 'groups/:id/edit',
    canActivate: [requireAnyGlobalPermission(V1Permission.PERMISSION_GROUPS_READ, V1Permission.PERMISSION_GROUPS_UPDATE)],
    resolve: {
      permissions: resolveGlobalPermissions(V1Permission.PERMISSION_GROUPS_UPDATE, V1Permission.PERMISSION_GROUPS_DELETE),
    },
    loadComponent: () => import('./groups/group-edit.component').then((m) => m.GroupEditComponent),
    providers: [
      { provide: GroupEditDataService, useClass: environment.dataServices.groupEdit },
    ],
  },
  {
    path: 'organizations',
    canActivate: [requireAllGlobalPermissions(V1Permission.PERMISSION_ORGANIZATIONS_READ)],
    resolve: {
      permissions: resolveGlobalPermissions(V1Permission.PERMISSION_ORGANIZATIONS_CREATE, V1Permission.PERMISSION_ORGANIZATIONS_UPDATE, V1Permission.PERMISSION_ORGANIZATIONS_ARCHIVE, V1Permission.PERMISSION_ORGANIZATIONS_DELETE),
    },
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
    canActivate: [requireAnyGlobalPermission(V1Permission.PERMISSION_ORGANIZATIONS_READ, V1Permission.PERMISSION_ORGANIZATIONS_UPDATE)],
    resolve: {
      permissions: resolveGlobalPermissions(V1Permission.PERMISSION_ORGANIZATIONS_UPDATE, V1Permission.PERMISSION_ORGANIZATIONS_ARCHIVE, V1Permission.PERMISSION_ORGANIZATIONS_DELETE),
    },
    loadComponent: () =>
      import('./organizations/organization-edit.component').then(
        (m) => m.OrganizationEditComponent
      ),
    providers: [
      { provide: OrganizationEditDataService, useClass: environment.dataServices.organizationEdit },
    ],
  },
];
