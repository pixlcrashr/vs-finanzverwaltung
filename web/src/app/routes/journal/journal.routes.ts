import { Routes } from '@angular/router';
import { JournalListDataService } from './journal-list/journal-list.data-service';
import { JournalImportDataService } from './journal-import/journal-import.data-service';
import { environment } from '../../../environments/environment';
import { requireAllPermissions } from '../../../lib/authz/permission.guard';
import { V1Permission } from '../../../lib/api/models';
import { resolvePermissions } from '../../../lib/authz/permission.resolver';

export const JOURNAL_ROUTES: Routes = [
  {
    path: '',
    canActivate: [requireAllPermissions(V1Permission.PERMISSION_JOURNAL_READ)],
    resolve: {
      permissions: resolvePermissions(V1Permission.PERMISSION_JOURNAL_IMPORT),
    },
    loadComponent: () =>
      import('./journal-list/journal-list.component').then((m) => m.JournalListComponent),
    providers: [{ provide: JournalListDataService, useClass: environment.dataServices.journalList }],
  },
  {
    path: 'import',
    canActivate: [requireAllPermissions(V1Permission.PERMISSION_JOURNAL_IMPORT)],
    loadComponent: () =>
      import('./journal-import/journal-import.component').then((m) => m.JournalImportComponent),
    providers: [{ provide: JournalImportDataService, useClass: environment.dataServices.journalImport }],
  },
];
