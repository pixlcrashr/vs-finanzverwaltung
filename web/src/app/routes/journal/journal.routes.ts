import { Routes } from '@angular/router';
import { JournalListDataService } from './journal-list/journal-list.data-service';
import { MockJournalListDataService } from '../../../lib/data/mock/journal-list.data-service.mock';
import { JournalImportDataService } from './journal-import/journal-import.data-service';
import { MockJournalImportDataService } from '../../../lib/data/mock/journal-import.data-service.mock';

export const JOURNAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./journal-list/journal-list.component').then((m) => m.JournalListComponent),
    providers: [{ provide: JournalListDataService, useClass: MockJournalListDataService }],
  },
  {
    path: 'import',
    loadComponent: () =>
      import('./journal-import/journal-import.component').then((m) => m.JournalImportComponent),
    providers: [{ provide: JournalImportDataService, useClass: MockJournalImportDataService }],
  },
];
