import { Routes } from '@angular/router';
import { JournalListDataService } from './journal-list/journal-list.data-service';
import { JournalAssignmentEditorDataService } from './journal-list/journal-assignment-editor.data-service';
import { LedgerYearListDataService } from '../ledger/ledger-years/ledger-year-list.data-service';
import { JournalImportDataService } from './journal-import/journal-import.data-service';
import { environment } from '../../../environments/environment';
import { requireAllPermissions } from '../../../lib/authz/permission.guard';
import { Permission, Permissions } from '../../../lib/authz/permissions';
import { resolvePermissions } from '../../../lib/authz/permission.resolver';

export const JOURNAL_ROUTES: Routes = [
  {
    path: '',
    canActivate: [requireAllPermissions(Permissions.JOURNAL_READ)],
    resolve: {
      permissions: resolvePermissions(Permissions.JOURNAL_IMPORT),
    },
    loadComponent: () =>
      import('./journal-list/journal-list.component').then((m) => m.JournalListComponent),
    providers: [
      { provide: JournalListDataService, useClass: environment.dataServices.journalList },
      { provide: JournalAssignmentEditorDataService, useClass: environment.dataServices.journalAssignmentEditor },
      { provide: LedgerYearListDataService, useClass: environment.dataServices.ledgerYearList },
    ],
  },
  {
    path: 'import',
    canActivate: [requireAllPermissions(Permissions.JOURNAL_IMPORT)],
    loadComponent: () =>
      import('./journal-import/journal-import.component').then((m) => m.JournalImportComponent),
    providers: [{ provide: JournalImportDataService, useClass: environment.dataServices.journalImport }],
  },
];
