import { Observable } from 'rxjs';
import { ImportSource } from '../../../shared/models';

export abstract class ImportSourceListDataService {
  abstract getImportSources(): Observable<ImportSource[]>;
}
