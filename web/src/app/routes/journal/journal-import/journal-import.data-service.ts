import { Observable } from 'rxjs';

export type JournalImportType = 'lexware' | 'datev';

export interface ImportSourceOption {
  id: string;
  name: string;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

export abstract class JournalImportDataService {
  abstract getImportSources(): Observable<ImportSourceOption[]>;
  abstract importFile(sourceId: string, type: JournalImportType, file: File): Observable<ImportResult>;
}
