import { Routes } from '@angular/router';
import { DashboardDataService } from './dashboard.data-service';
import { MockDashboardDataService } from '../../../lib/data/mock/dashboard.data-service.mock';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard.component').then((m) => m.DashboardComponent),
    providers: [{ provide: DashboardDataService, useClass: MockDashboardDataService }],
  },
];
