# Developer Agent Memory

## Project Architecture Notes

### Report System
- Handlebars templates are stored in the database (`report_templates` table), not as files
- The example template is at `test/reports/example-report.handlebars`
- In templates, `getActualValue` receives a **budget ID** (via `../id`) as its first arg, NOT a revision ID
- `getTargetValue` and `getDiffValue` receive a **revision ID** as their first arg
- The Handlebars context (`this`) inside `{{#each revisions}}` is the revision object
- `avMap` uses key format `budgetId:accountId`, `bravMap` uses `revisionId:accountId`

### Key File Relationships
- `src/lib/reports/generate.ts` - builds data (avMap, bravMap, handlers)
- `src/lib/reports/render.ts` - Handlebars helpers bridge template calls to handlers
- `src/routes/matrix/index@menu.tsx` - working reference for actual value calculation
- Both matrix view and report generation use the same SQL query for actual values

### Common Pitfalls
- Template helpers in render.ts must match the argument types the templates pass
- `filterReachableAccounts` walks UP parent chain; orphan accounts can occur if ancestor IDs are missing from selectedIds
- `buildTreeFromDB` only makes root nodes from accounts with `parent_account_id === null`
