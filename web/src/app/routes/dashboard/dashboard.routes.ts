import { Routes } from '@angular/router';
import { DashboardDataService } from './dashboard.data-service';
import { environment } from '../../../environments/environment';
import { requireAllPermissions } from '../../../lib/authz/permission.guard';
import { Permission, Permissions } from '../../../lib/authz/permissions';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    canActivate: [requireAllPermissions(Permissions.DASHBOARD_READ)],
    loadComponent: () => import('./dashboard.component').then((m) => m.DashboardComponent),
    providers: [{ provide: DashboardDataService, useClass: environment.dataServices.dashboard }],
  },
];
