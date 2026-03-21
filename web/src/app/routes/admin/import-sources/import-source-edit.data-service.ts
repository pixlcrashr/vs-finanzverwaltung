import { Observable } from 'rxjs';
import { ImportSource } from '../../../shared/models';

export interface UpdateImportSourceInput {
  name: string;
  description: string;
}

export abstract class ImportSourceEditDataService {
  abstract getImportSource(id: string): Observable<ImportSource>;
  abstract updateImportSource(id: string, input: UpdateImportSourceInput): Observable<ImportSource>;
  abstract closePeriod(sourceId: string, periodId: string): Observable<void>;
}
