import { Routes } from '@angular/router';
import { DashboardDataService } from './dashboard.data-service';
import { environment } from '../../../environments/environment';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard.component').then((m) => m.DashboardComponent),
    providers: [{ provide: DashboardDataService, useClass: environment.dataServices.dashboard }],
  },
];
