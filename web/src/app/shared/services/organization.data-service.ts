import { Observable } from 'rxjs';
import { Organization } from '../models';

export abstract class OrganizationDataService {
  abstract getOrganizations(): Observable<Organization[]>;
  abstract createOrganization(name: string, description: string): Observable<Organization>;
}
