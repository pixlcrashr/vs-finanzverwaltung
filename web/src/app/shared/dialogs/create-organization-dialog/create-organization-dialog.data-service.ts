import { Observable } from 'rxjs';
import { CreatedOrganization } from './create-organization-dialog.component';

export abstract class CreateOrganizationDialogDataService {
  abstract createOrganization(name: string, description: string, organizationId?: string): Observable<CreatedOrganization>;
  abstract isOrganizationIdAvailable(organizationId: string): Observable<boolean>;
}
