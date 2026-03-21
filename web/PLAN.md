# Angular Web Application Implementation Plan

## Overview
Migrate the Qwik-based application to Angular 21, implementing all existing routes (except rendering and matrix routes), with TailwindCSS styling, dark/light mode support, and the data service pattern defined in CLAUDE.md.

## Routes to Implement

### Main Routes (excluding matrix/ and rendering)
1. **Dashboard** (`/dashboard`) - Statistics with charts
2. **Budgets** (`/budgets`) - List, create, edit, delete budgets
3. **Accounts** (`/accounts`) - Hierarchical account list with CRUD
4. **Account Compare** (`/accounts/compare`) - Account comparison view
5. **Account Groups** (`/account-groups`) - Group management with CRUD
6. **Journal** (`/journal`) - Transaction list with pagination
7. **Journal Import** (`/journal/import`) - Import transactions
8. **Transactions** (`/transactions/:id`) - Edit/delete transactions
9. **Reports** (`/reports`) - Report list and viewing
10. **Report Templates** (`/report-templates`) - Template management

### Admin Routes
11. **Settings** (`/admin/settings`) - System settings
12. **Users** (`/admin/users`) - User management
13. **Groups** (`/admin/groups`) - Role group management
14. **Import Sources** (`/admin/import-sources`) - Import source configuration

## Directory Structure

```
web/src/
├── app/
│   ├── app.ts                          # Root component
│   ├── app.html                        # Root template
│   ├── app.scss                        # Global styles
│   ├── app.config.ts                   # App configuration
│   ├── app.routes.ts                   # Root routes with lazy loading
│   │
│   ├── routes/                         # Route pages
│   │   ├── dashboard/
│   │   │   ├── dashboard.component.ts
│   │   │   ├── dashboard.routes.ts
│   │   │   └── dashboard.data-service.ts
│   │   │
│   │   ├── budgets/
│   │   │   ├── budgets.routes.ts
│   │   │   ├── budget-list/
│   │   │   │   ├── budget-list.component.ts
│   │   │   │   └── budget-list.data-service.ts
│   │   │   ├── budget-edit/
│   │   │   │   ├── budget-edit.component.ts
│   │   │   │   └── budget-edit.data-service.ts
│   │   │   └── budget-delete/
│   │   │
│   │   ├── accounts/
│   │   │   ├── accounts.routes.ts
│   │   │   ├── account-list/
│   │   │   ├── account-edit/
│   │   │   ├── account-delete/
│   │   │   └── account-compare/
│   │   │
│   │   ├── account-groups/
│   │   │   ├── account-groups.routes.ts
│   │   │   ├── account-group-list/
│   │   │   ├── account-group-view/
│   │   │   ├── account-group-edit/
│   │   │   └── account-group-delete/
│   │   │
│   │   ├── journal/
│   │   │   ├── journal.routes.ts
│   │   │   ├── journal-list/
│   │   │   └── journal-import/
│   │   │
│   │   ├── transactions/
│   │   │   ├── transactions.routes.ts
│   │   │   ├── transaction-edit/
│   │   │   └── transaction-delete/
│   │   │
│   │   ├── reports/
│   │   │   ├── reports.routes.ts
│   │   │   ├── report-list/
│   │   │   └── report-view/
│   │   │
│   │   ├── report-templates/
│   │   │   ├── report-templates.routes.ts
│   │   │   ├── report-template-list/
│   │   │   ├── report-template-new/
│   │   │   └── report-template-edit/
│   │   │
│   │   └── admin/
│   │       ├── admin.routes.ts
│   │       ├── settings/
│   │       ├── users/
│   │       ├── groups/
│   │       └── import-sources/
│   │
│   └── shared/
│       ├── layout/
│       │   ├── main-layout/
│       │   │   ├── main-layout.component.ts
│       │   │   └── main-layout.component.scss
│       │   ├── header/
│       │   ├── sidebar/
│       │   └── page-content/
│       │
│       ├── components/
│       │   ├── breadcrumb/
│       │   ├── data-table/
│       │   ├── confirm-dialog/
│       │   ├── loading-spinner/
│       │   └── empty-state/
│       │
│       ├── models/
│       │   ├── account.model.ts
│       │   ├── budget.model.ts
│       │   ├── transaction.model.ts
│       │   └── ...
│       │
│       └── utils/
│           ├── date-format.ts
│           └── ...
│
├── lib/
│   └── data/
│       └── mock/
│           ├── dashboard.data-service.mock.ts
│           ├── budgets.data-service.mock.ts
│           ├── accounts.data-service.mock.ts
│           └── ...
│
└── styles/
    ├── _variables.scss
    ├── _theme.scss
    └── tailwind.scss
```

## Implementation Phases

### Phase 1: Foundation Setup
1. Install and configure TailwindCSS
2. Install faker-js for mock data
3. Set up dark/light theme system with CSS variables
4. Create base SCSS variables and theme configuration
5. Set up app.routes.ts with lazy loading structure

### Phase 2: Shared Components & Layout
1. **MainLayoutComponent** - Sidebar + main content area
2. **SidebarComponent** - Navigation menu (main + admin sections)
3. **HeaderComponent** - Page header with breadcrumbs and action buttons
4. **PageContentComponent** - Content wrapper
5. **BreadcrumbComponent** - Navigation breadcrumbs
6. **DataTableComponent** - Reusable table with pagination
7. **ConfirmDialogComponent** - Confirmation modals
8. **LoadingSpinnerComponent** - Loading indicator
9. **EmptyStateComponent** - Empty data placeholder

### Phase 3: Dashboard Route
1. Create DashboardDataService contract
2. Create MockDashboardDataService with faker-js
3. Implement dashboard component with chart placeholders
4. Wire up data service DI

### Phase 4: Budgets Routes
1. Create BudgetListDataService + mock
2. Create BudgetEditDataService + mock
3. Implement budget list component with table
4. Implement budget create/edit form with FormGroup
5. Implement budget delete confirmation

### Phase 5: Accounts Routes
1. Create AccountListDataService + mock
2. Create AccountEditDataService + mock
3. Implement hierarchical account list
4. Implement account create/edit form
5. Implement account delete confirmation
6. Implement account compare view

### Phase 6: Account Groups Routes
1. Create AccountGroupDataService + mock
2. Implement account group list
3. Implement account group view (statistics)
4. Implement account group edit
5. Implement account group delete

### Phase 7: Journal & Transactions Routes
1. Create JournalDataService + mock
2. Create TransactionDataService + mock
3. Implement journal list with pagination
4. Implement journal import
5. Implement transaction edit/delete

### Phase 8: Reports & Templates Routes
1. Create ReportsDataService + mock
2. Create ReportTemplatesDataService + mock
3. Implement report list
4. Implement report view
5. Implement report template CRUD

### Phase 9: Admin Routes
1. Create SettingsDataService + mock
2. Create UsersDataService + mock
3. Create GroupsDataService + mock
4. Create ImportSourcesDataService + mock
5. Implement all admin pages

### Phase 10: Polish & Testing
1. Verify dark/light mode across all components
2. Ensure responsive design
3. Add accessibility attributes
4. Test lazy loading

## Key Technical Decisions

### Routing Strategy
- Lazy load all route modules for better initial load time
- Use Angular Router with child routes for nested pages
- Convert kebab-case URLs (e.g., `/account-groups` instead of `/accountGroups`)

### State Management
- Use signals for component state
- Use computed() for derived state
- Data services return Observables

### Forms
- Use Reactive Forms (FormGroup/FormControl)
- Implement form validation
- Use OnPush change detection

### Styling
- TailwindCSS for utility classes
- SCSS for component-specific styles
- CSS custom properties for theming
- Dark mode via class toggle on body/html

### Data Service Pattern (per CLAUDE.md)
- Abstract class in component folder defines contract
- Mock implementation in `src/lib/data/mock/`
- Use faker-js for realistic mock data
- Components inject abstract class
- Provider maps abstract to mock implementation

## Menu Structure (from Qwik app)

### Main Menu
- Dashboard (`/dashboard`)
- Pläne (Budgets) (`/budgets`)
- Konten (Accounts) (`/accounts`)
- Kontenvergleich (`/accounts/compare`)
- Kontengruppen (`/account-groups`)
- Journal (`/journal`)
- Berichte (`/reports`)
- Berichtsvorlagen (`/report-templates`)

### Admin Menu
- Einstellungen (`/admin/settings`)
- Benutzer (`/admin/users`)
- Gruppen (`/admin/groups`)
- Importquellen (`/admin/import-sources`)

## Theme Configuration

### Light Mode
- Background: white/gray-50
- Text: gray-900
- Sidebar: white with gray border
- Primary: blue-600

### Dark Mode
- Background: gray-900/gray-950
- Text: gray-100
- Sidebar: gray-950 with gray-800 border
- Primary: blue-500

## Dependencies to Install
```bash
npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms
npm install @faker-js/faker
npm install @angular/cdk  # For dialogs and overlays
npm install chart.js  # For dashboard charts (if needed)
```

## Dialog Implementation
- Use Angular CDK Dialog for modal dialogs and confirmations
- CDK provides accessible, unstyled dialog primitives
- Style dialogs with TailwindCSS to match the theme
