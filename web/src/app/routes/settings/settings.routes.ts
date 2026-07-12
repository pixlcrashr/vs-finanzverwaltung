import { Routes } from '@angular/router';
import { OrganizationSettingsDataService } from './organization-settings.data-service';
import { environment } from '../../../environments/environment';
import { requireAllPermissions } from '../../../lib/authz/permission.guard';
import { V1Permission } from '../../../lib/api/models';
import { resolvePermissions } from '../../../lib/authz/permission.resolver';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [requireAllPermissions(V1Permission.PERMISSION_SETTINGS_READ)],
    resolve: {
      permissions: resolvePermissions(V1Permission.PERMISSION_SETTINGS_UPDATE),
    },
    loadComponent: () =>
      import('./organization-settings.component').then(
        (m) => m.OrganizationSettingsComponent
      ),
    providers: [
      { provide: OrganizationSettingsDataService, useClass: environment.dataServices.organizationSettings },
    ],
  },
];
