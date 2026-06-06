import { Observable } from 'rxjs';
import { Organization } from '../../../shared/models';

export abstract class OrganizationListDataService {
  abstract getOrganizations(): Observable<Organization[]>;
  abstract deleteOrganization(id: string): Observable<void>;
}
