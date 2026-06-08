import { Routes } from '@angular/router';
import { OrganizationDataService } from './shared/services/organization.data-service';
import { environment } from '../environments/environment';

export const routes: Routes = [
  // Main layout with left sidebar - single instance for all routes
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    providers: [
      { provide: OrganizationDataService, useClass: environment.dataServices.organization },
    ],
    children: [
      // Admin routes
      {
        path: 'admin',
        loadChildren: () => import('./routes/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      // Organization-prefixed routes with full path
      {
        path: 'organizations/:orgId',
        redirectTo: 'organizations/:orgId/dashboard',
        pathMatch: 'full',
      },
      {
        path: 'organizations/:orgId/dashboard',
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        loadChildren: () =>
          import('./routes/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'organizations/:orgId/reimbursements',
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        loadChildren: () =>
          import('./routes/reimbursements/reimbursements.routes').then(
            (m) => m.REIMBURSEMENTS_ROUTES,
          ),
      },
      {
        path: 'organizations/:orgId/budgets',
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        loadChildren: () => import('./routes/budgets/budgets.routes').then((m) => m.BUDGETS_ROUTES),
      },
      {
        path: 'organizations/:orgId/accounts',
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        loadChildren: () =>
          import('./routes/accounts/accounts.routes').then((m) => m.ACCOUNTS_ROUTES),
      },
      {
        path: 'organizations/:orgId/accountGroups',
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        loadChildren: () =>
          import('./routes/account-groups/account-groups.routes').then(
            (m) => m.ACCOUNT_GROUPS_ROUTES,
          ),
      },
      {
        path: 'organizations/:orgId/journal',
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        loadChildren: () => import('./routes/journal/journal.routes').then((m) => m.JOURNAL_ROUTES),
      },
      {
        path: 'organizations/:orgId/transactions',
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        loadChildren: () =>
          import('./routes/transactions/transactions.routes').then((m) => m.TRANSACTIONS_ROUTES),
      },
      {
        path: 'organizations/:orgId/reports',
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        loadChildren: () => import('./routes/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
      },
      {
        path: 'organizations/:orgId/reportTemplates',
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        loadChildren: () =>
          import('./routes/report-templates/report-templates.routes').then(
            (m) => m.REPORT_TEMPLATES_ROUTES,
          ),
      },
      {
        path: 'organizations/:orgId/matrix',
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        loadChildren: () => import('./routes/matrix/matrix.routes').then((m) => m.MATRIX_ROUTES),
      },
    ],
  },
];
