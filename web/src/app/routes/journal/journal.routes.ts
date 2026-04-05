import { Routes } from '@angular/router';
import { JournalListDataService } from './journal-list/journal-list.data-service';
import { JournalImportDataService } from './journal-import/journal-import.data-service';
import { environment } from '../../../environments/environment';

export const JOURNAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./journal-list/journal-list.component').then((m) => m.JournalListComponent),
    providers: [{ provide: JournalListDataService, useClass: environment.dataServices.journalList }],
  },
  {
    path: 'import',
    loadComponent: () =>
      import('./journal-import/journal-import.component').then((m) => m.JournalImportComponent),
    providers: [{ provide: JournalImportDataService, useClass: environment.dataServices.journalImport }],
  },
];
