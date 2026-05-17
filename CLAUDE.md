# CLAUDE.md

Use the `developer` agent to suggest improvements in this project.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

DO NOT provide a summary at the end of your summary.

## Project Overview

VS-Finanzverwaltung is a financial management system for German student organizations (Verfasste Studierendenschaften). It provides budget planning, transaction management with double-entry bookkeeping, and comprehensive reporting capabilities.

**Tech Stack:**
- **Frontend**: Angular SPA (Single Page Application)
- **Backend**: Go server with Fiber + Huma v2 RESTful API
- **Database**: PostgreSQL with GORM + gorm-gen
- **Migrations**: golang-migrate with embedded SQL files
- **Auth**: OAuth2/SSO with Casbin RBAC
- **Reports**: Handlebars templates with html2pdf service
- **i18n**: Angular i18n (default: de-DE, also supports en-GB)
- **Styling**: Modern CSS framework + SASS

## Go Server (`pkg/`) Development

You are an expert in Go, building RESTful APIs, and scalable backend development. You write clean, idiomatic, maintainable, and performant Go code following best practices.

### Project Structure
- `pkg/api/` - API handlers, routes, and models using Huma v2 framework
- `pkg/db/` - Database connection, migrations, models, and repositories
- `pkg/db/model/` - GORM model definitions
- `pkg/db/model/dao/` - Generated type-safe query layer (gorm-gen)
- `pkg/db/repository/` - Repository pattern implementations
- `pkg/cfg/` - Configuration management
- `cmd/` - CLI commands (serve, migrate)
- `migrations/` - SQL migration files for golang-migrate

### Key Dependencies
- **HTTP Framework**: Fiber v2 with Huma v2 for OpenAPI-first API design
- **ORM**: GORM with gorm-gen for type-safe queries
- **Migrations**: golang-migrate with embedded SQL files
- **Pagination**: go-pagetoken for keyset pagination
- **Decimals**: cockroachdb/apd for precise financial arithmetic
- **CLI**: Cobra + Viper for commands and configuration

### Go Best Practices
- Follow standard Go project layout conventions
- Use proper error handling (never ignore errors)
- Prefer composition over inheritance
- Write idiomatic Go code following effective Go guidelines
- Use context for cancellation and timeouts
- Keep dependencies minimal and well-managed with go.mod

### API Design
- Follow RESTful principles and Google AIPs for API endpoints
- Use Huma v2 for request/response validation and OpenAPI generation
- Use proper HTTP status codes
- Implement offset-limit pagination for most endpoints
- Use keyset pagination (go-pagetoken) for large lists (transactions, journals)
- Return consistent JSON response structures

### Database Integration
- Use GORM with gorm-gen for type-safe database operations
- Use golang-migrate for database migrations (SQL files in `migrations/`)
- Implement proper transaction handling
- Follow repository pattern for data access in `pkg/db/repository/`
- Use `OptionalParam` type for optional query parameters

### Security
- Implement proper authentication and authorization
- Use Casbin for RBAC enforcement
- Validate and sanitize all inputs
- Follow security best practices for API development

## Angular (`web/`) Development

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

### Architecture
- The Angular SPA communicates with the Go backend via RESTful API
- Implement proper HTTP interceptors for authentication
- Use Angular services for API communication
- Handle API errors gracefully with user-friendly messages
### TypeScript Best Practices
- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
### Angular Best Practices
- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.
### Accessibility Requirements
- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.
#### Components
- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.
### State Management
- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead
### Templates
- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
### Services
- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

### Data Services Pattern
Components that access the API must follow this pattern:

1. **Abstract Data Service**: Define an abstract class `XXXDataService` in the component's folder that declares the API contract
2. **Mock Implementation**: Create a mock implementation `MockXXXDataService` in `src/lib/data/mock/`
3. **Dependency Injection**: Components depend on the abstract class; the mock is injected via DI
4. **No API Implementation by Default**: Only create the contract + mock implementation initially
5. **Component-Specific Contracts**: Each component defines only the methods it needs; duplicates across components are acceptable

**Directory Structure:**
```
web/src/app/features/example/
├── example.component.ts
└── example.data-service.ts      # Abstract class (contract) - component-specific

web/src/lib/data/mock/
└── example.data-service.mock.ts # Mock implementation
```

**Example:**
```typescript
// src/app/features/example/example.data-service.ts
// Contract defines ONLY what this component needs
export abstract class ExampleDataService {
  abstract getItems(): Observable<Item[]>;
  abstract getItem(id: string): Observable<Item>;
}

// src/app/features/other/other.data-service.ts
// Another component may define overlapping methods - this is OK
export abstract class OtherDataService {
  abstract getItem(id: string): Observable<Item>;  // Duplicate is acceptable
  abstract deleteItem(id: string): Observable<void>;
}

// src/lib/data/mock/example.data-service.mock.ts
import { faker } from '@faker-js/faker';

@Injectable()
export class MockExampleDataService extends ExampleDataService {
  getItems(): Observable<Item[]> {
    return of(Array.from({ length: 10 }, () => this.generateItem()));
  }

  getItem(id: string): Observable<Item> {
    return of(this.generateItem());
  }

  private generateItem(): Item {
    return {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      // ...
    };
  }
}
```

**Component Usage:**
```typescript
@Component({ ... })
export class ExampleComponent {
  private dataService = inject(ExampleDataService);
}
```

**Provider Configuration:**
```typescript
// In app.config.ts or feature module
{ provide: ExampleDataService, useClass: MockExampleDataService }
```

**Guidelines:**
- Define contracts in the component folder - each component declares only what it needs
- Duplicate method signatures across contracts are acceptable (Interface Segregation Principle)
- Use `faker-js` for generating realistic mock data
- Mock services should simulate realistic delays using `delay()` operator when appropriate
- If a component needs non-API logic, create a separate `XXXService` class for that functionality
- Keep data services focused solely on API communication concerns
