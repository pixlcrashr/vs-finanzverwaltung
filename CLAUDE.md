# CLAUDE.md

Use the `developer` agent to suggest improvements in this project.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VS-Finanzverwaltung is a financial management system for German student organizations (Verfasste Studierendenschaften). It provides budget planning, transaction management with double-entry bookkeeping, and comprehensive reporting capabilities.

**Tech Stack:**
- **Frontend/Backend**: Qwik with Qwik City (SSR framework)
- **Server**: Fastify adapter
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: OAuth2/SSO with Casbin RBAC
- **Reports**: Handlebars templates with html2pdf service
- **i18n**: compiled-i18n (default: de-DE, also supports en-GB)
- **Styling**: Bulma CSS framework + SASS

## Development Commands

### Setup
```bash
npm install                      # Install dependencies and generate Prisma client
docker compose -f docker-compose.dev.yaml up -d  # Start PostgreSQL + html2pdf services
npm run prisma:migrate          # Run database migrations
```

### Development
```bash
npm run dev                     # Start dev server (http://localhost:5173)
npm run dev.debug               # Start with Node inspector for debugging
```

### Building
```bash
npm run build                   # Full production build (client + server)
npm run build.client            # Build client only
npm run build.server            # Build server adapter
npm run build.types             # Type check without emitting files
```

### Testing & Quality
```bash
npm run lint                    # ESLint check
npm run fmt                     # Format with Prettier
npm run fmt.check               # Check formatting
npx tsc --noEmit                # TypeScript type checking
```

### Database
```bash
npm run prisma:generate         # Generate Prisma client (auto-runs on postinstall)
npm run prisma:migrate          # Create and apply migrations (dev)
npm run prisma:migrate:prod     # Apply migrations (production)
npx prisma studio               # Open Prisma Studio GUI
```

### Production
```bash
npm run serve                   # Run production server (after build)
```

### Releases
```bash
task release                    # Create versioned release with commit-and-tag-version
```

## Architecture

### Qwik City Routing

File-based routing under `src/routes/`. Special filename patterns:

- **`layout.tsx`**: Wraps child routes, used for shared middleware and layouts
- **`index.tsx`**: Default page for a route
- **`index@menu.tsx`**: Modal/menu variant of a route that renders in an overlay without navigation (suffix pattern)
- **`[param]/`**: Dynamic route parameters

**Route Middleware**: Use `onRequest` exports for authentication/authorization:
```typescript
export const onRequest = requirePermission(Permissions.BUDGETS_READ);
```

### Data Layer

**Prisma Configuration:**
- Schema: `prisma/schema.prisma`
- Generated client output: `src/lib/prisma/generated` (custom location)
- Import as: `import { Prisma } from "~/lib/prisma"`

**Key Domain Models:**
- **budgets**: Budget definitions with period dates
- **budget_revisions**: Versioned budget snapshots
- **budget_revision_account_values**: Budget values per account per revision
- **accounts**: Hierarchical budget accounts (self-referential via `parent_account_id`)
- **account_groups**: Logical groupings of accounts
- **transactions**: Double-entry bookkeeping transactions
- **transaction_accounts**: External accounts from import sources (DATEV, Lexware)
- **transaction_account_assignments**: Maps transactions to budget accounts
- **views**: Custom filtered views of accounts/budgets
- **report_templates**: Handlebars templates for reports
- **reports**: Generated report artifacts

**Financial Calculations**: Always use `Decimal.js` for currency/financial values to avoid floating-point precision issues.

### Authentication & Authorization

**System**: Casbin RBAC (Role-Based Access Control)

**Roles**: `admin`, `editor`, `viewer` (see `src/lib/auth/permissions.ts`)

**Usage in Routes:**
```typescript
import { requireAuth, requirePermission, requireRole } from '~/lib/auth';

// Require authentication
export const onRequest = requireAuth();

// Require specific permission
export const onRequest = requirePermission(Permissions.ACCOUNTS_UPDATE);

// Require admin role
export const onRequest = requireRole('admin');
```

**Permission Checks in Server Actions:**
```typescript
import { checkPermission } from '~/lib/auth';

const canUpdate = await checkPermission(userId, 'accounts', 'update');
if (!canUpdate) throw new Error('Forbidden');
```

**Key Files:**
- `src/lib/auth/middleware.ts`: Route protection middleware
- `src/lib/auth/permissions.ts`: Role and permission definitions
- `src/lib/auth/rbac.ts`: Role management functions
- `src/lib/auth/README.md`: Detailed auth documentation

### Report Generation

**Flow:**
1. User selects report template + data filters (budgets, date ranges, options)
2. `src/lib/reports/generate.ts`: Builds report data structure
3. `src/lib/reports/render.ts`: Renders Handlebars template with custom helpers
4. HTML sent to html2pdf service for PDF/Excel generation

**Key Features:**
- Revision comparison (show changes between budget versions)
- "Show changed values only" filtering (from 2nd revision onwards)
- "Latest revision only" mode
- Custom Handlebars helpers for currency formatting, value retrieval

**Important Files:**
- `src/components/reports/CreateReportMenu.tsx`: Report generation UI
- `src/components/reports/RenderReportMenu.tsx`: Report display/export UI
- `src/lib/reports/generate.ts`: Core report data generation
- `src/lib/reports/render.ts`: Handlebars template rendering
- `src/lib/format.ts`: Formatting utilities (currency, dates)

### Import System

Supports importing transactions from:
- **DATEV** format (German accounting software)
- **Lexware** format (German accounting software)

**Import Flow:**
1. Parse CSV/file with `src/lib/datev/` or `src/lib/lexware/`
2. Create `transaction_accounts` for external accounts
3. Create `transactions` with double-entry bookkeeping
4. Assign transactions to budget accounts via `transaction_account_assignments`

### Internationalization

**System**: compiled-i18n (compile-time i18n)

**Usage:**
```typescript
import { _ } from 'compiled-i18n';
const text = _`Hello, world!`;
```

**Configuration**: `vite.config.ts` - `i18nPlugin({ defaultLocale: 'de-DE', locales: ['de-DE', 'en-GB'] })`

Translations stored in `i18n/` directory.

## Key Development Patterns

### Path Aliases
```typescript
import { Prisma } from "~/lib/prisma";  // ~ maps to src/
```

### Server Actions with Validation
```typescript
import { routeAction$, zod$, z } from "@builder.io/qwik-city";

export const useCreateBudget = routeAction$(
  async (data) => {
    // Server-side logic
  },
  zod$({ name: z.string(), amount: z.number() })
);
```

### Menu/Modal Pattern
Routes with `@menu` suffix render as overlays. Use for forms and detail views that don't require full navigation:
- `budgets/index@menu.tsx`: Budget list with creation form
- `accounts/[accountId]/edit/index@menu.tsx`: Edit form modal

### Financial Calculations
```typescript
import Decimal from 'decimal.js';

const total = new Decimal(100.50).plus(200.25);
const formatted = total.toFixed(2); // "300.75"
```

Always store financial values as `Decimal` type in database schema.

### Component Organization
- `src/components/`: Reusable Qwik components
- `src/components/layout/`: Layout components (Header, MainContent, etc.)
- `src/components/[domain]/`: Domain-specific components (budgets, accounts, reports)

### Styling
- Use Bulma classes for layout and common UI patterns
- Component-specific styles with SASS modules: `import styles from "./style.scss?inline"`
- Scoped styles: `useStylesScoped$(styles)` in component

## Environment Setup

**Required Environment Variables** (see `.env.example`):
```bash
DB_URL="postgres://user:password@host:port/database"
AUTH_SECRET="random-secret-key"
GITLAB_CLIENT_ID="oauth-client-id"
GITLAB_CLIENT_SECRET="oauth-client-secret"
GITLAB_ISSUER="https://gitlab.com/oauth/authorize"
ORGANISATION_NAME="Organization Name"
PUBLIC_VERSION="version-string"
```

**Development Services** (via docker-compose.dev.yaml):
- PostgreSQL: `localhost:5334` (development DB)
- PostgreSQL: `localhost:5335` (test DB)
- html2pdf: `localhost:8082` (PDF generation service)

## Important Notes

- **Node Version**: Requires Node.js ^20.3.0 || >=21.0.0
- **Database**: PostgreSQL-specific features used (gen_random_uuid(), timestamps)
- **Prisma Client**: Generated to non-standard location (`src/lib/prisma/generated`)
- **SSR**: Application uses Qwik's SSR mode, not SPA mode
- **Type Safety**: Strict TypeScript configuration enabled
- **Git Hooks**: May be configured for pre-commit checks

## Code Quality Standards

- Use TypeScript strict mode
- Format with Prettier before committing
- Run ESLint checks
- Avoid floating-point arithmetic for financial calculations (use Decimal.js)
- Check permissions in route middleware or server actions
- Use Qwik's reactivity primitives (`useSignal`, `useComputed$`, etc.) correctly
