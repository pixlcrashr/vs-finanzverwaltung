import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./routes/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'antraege',
        loadComponent: () =>
          import('./routes/antraege/antraege.component').then((m) => m.AntraegeComponent),
      },
      {
        path: 'antragsarten',
        loadComponent: () =>
          import('./routes/antragsarten/antragsarten.component').then(
            (m) => m.AntragsartenComponent,
          ),
      },
      {
        path: 'budgets',
        loadChildren: () => import('./routes/budgets/budgets.routes').then((m) => m.BUDGETS_ROUTES),
      },
      {
        path: 'accounts',
        loadChildren: () =>
          import('./routes/accounts/accounts.routes').then((m) => m.ACCOUNTS_ROUTES),
      },
      {
        path: 'account-groups',
        loadChildren: () =>
          import('./routes/account-groups/account-groups.routes').then(
            (m) => m.ACCOUNT_GROUPS_ROUTES,
          ),
      },
      {
        path: 'journal',
        loadChildren: () => import('./routes/journal/journal.routes').then((m) => m.JOURNAL_ROUTES),
      },
      {
        path: 'transactions',
        loadChildren: () =>
          import('./routes/transactions/transactions.routes').then((m) => m.TRANSACTIONS_ROUTES),
      },
      {
        path: 'reports',
        loadChildren: () => import('./routes/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
      },
      {
        path: 'report-templates',
        loadChildren: () =>
          import('./routes/report-templates/report-templates.routes').then(
            (m) => m.REPORT_TEMPLATES_ROUTES,
          ),
      },
      {
        path: 'admin',
        loadChildren: () => import('./routes/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
