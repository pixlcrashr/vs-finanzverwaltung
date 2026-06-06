import { Observable } from 'rxjs';
import { Organization } from '../../../shared/models';

export interface UpdateOrganizationInput {
  name: string;
  description: string;
}

export abstract class OrganizationEditDataService {
  abstract getOrganization(id: string): Observable<Organization>;
  abstract updateOrganization(id: string, input: UpdateOrganizationInput): Observable<Organization>;
}
