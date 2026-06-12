import { Observable } from 'rxjs';
import { Organization } from '../../models';

export abstract class MainLayoutDataService {
  abstract getOrganizations(): Observable<Organization[]>;
}
