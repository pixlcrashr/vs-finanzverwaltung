# Web Application Agent Documentation

This document provides essential information for AI agents working on the VS-Finanzverwaltung web application.

## Technology Stack

- **Framework**: Angular 19+ (standalone components)
- **Package Manager**: npm
- **Styling**: TailwindCSS
- **Language**: TypeScript
- **Dialogs**: Angular CDK Dialog

## Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── routes/           # Feature routes (lazy-loaded)
│   │   │   ├── accounts/
│   │   │   ├── admin/
│   │   │   ├── applications/
│   │   │   ├── application-types/
│   │   │   ├── budgets/
│   │   │   ├── reports/
│   │   │   └── ...
│   │   ├── shared/
│   │   │   ├── components/   # Reusable UI components
│   │   │   ├── layout/       # Layout components (MainLayoutComponent)
│   │   │   ├── models/       # TypeScript interfaces/types
│   │   │   └── utils/        # Utility functions
│   │   ├── app.routes.ts     # Main routing configuration
│   │   └── app.ts            # Root component
│   └── lib/
│       └── data/
│           └── mock/         # Mock data services for development
```

## Key Conventions

### Component Structure
- Use standalone components with `ChangeDetectionStrategy.OnPush`
- Inline templates in component files for single-file components
- Use Angular signals for reactive state management
- Import dependencies directly in component decorator

### Styling Guidelines
- Use TailwindCSS utility classes
- Dialog width: `max-w-lg` (512px) for consistency
- Container centering: `flex flex-1 justify-center` with `w-full max-w-3xl`
- Text sizes: `text-xs` for body, `text-sm` for headings, `text-[10px]` for labels

### Data Services
- Abstract data service classes in route folders (e.g., `*.data-service.ts`)
- Mock implementations in `src/lib/data/mock/`
- Services injected via route providers in `*.routes.ts` files

### Dialog Pattern
```typescript
// Template
<ng-template #dialogTemplate>
  <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-4">
    <!-- Dialog content -->
  </div>
</ng-template>

// Component
readonly dialogTemplate = viewChild.required<TemplateRef<unknown>>('dialogTemplate');
private dialogRef: ReturnType<typeof this.dialog.open> | null = null;

openDialog(): void {
  this.dialogRef = this.dialog.open(this.dialogTemplate(), {
    panelClass: ['flex', 'items-center', 'justify-center'],
    backdropClass: 'bg-black/50',
    width: '500px',
  });
}

closeDialog(): void {
  this.dialogRef?.close();
  this.dialogRef = null;
}
```

### Report Templates
- Use **Go template syntax** (not Handlebars)
- Variables: `{{ .VariableName }}`
- Loops: `{{ range .Items }}...{{ end }}`
- Conditionals: `{{ if .Condition }}...{{ end }}`

## Common Shared Components

- `PageHeaderComponent` - Page header with breadcrumbs
- `ButtonComponent` - Styled button with variants (primary, secondary, danger)
- `LoadingSpinnerComponent` - Loading indicator with optional text
- `EmptyStateComponent` - Empty state placeholder
- `StatusBadgeComponent` - Status indicators

## Route Configuration

Routes are lazy-loaded and configured in `app.routes.ts`. Each feature has its own routes file (e.g., `budgets.routes.ts`) that exports a `Routes` array.

## Important Notes

1. **Mock Data**: Currently using mock data services. Real API integration pending.
2. **Internationalization**: UI is primarily in German with some English sections.
3. **Theme Support**: Dark/light mode toggle available in sidebar.
4. **Form Handling**: Use Angular Reactive Forms or template-driven forms with `FormsModule`.
