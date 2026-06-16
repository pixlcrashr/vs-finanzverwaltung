import { Routes } from '@angular/router';
import { OrganizationSettingsDataService } from './organization-settings.data-service';
import { environment } from '../../../environments/environment';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./organization-settings.component').then(
        (m) => m.OrganizationSettingsComponent
      ),
    providers: [
      { provide: OrganizationSettingsDataService, useClass: environment.dataServices.organizationSettings },
    ],
  },
];
