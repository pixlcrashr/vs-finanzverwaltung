import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { OrganizationServiceService } from '../../api/services/organization-service.service';
import { Organization } from '../../../app/shared/models';
import { OrganizationDataService } from '../../../app/shared/services/organization.data-service';

@Injectable()
export class HttpOrganizationDataService extends OrganizationDataService {
  private readonly svc = inject(OrganizationServiceService);

  getOrganizations(): Observable<Organization[]> {
    return this.svc.OrganizationServiceListOrganizations({ pageSize: 100 }).pipe(
      map((resp) =>
        (resp.organizations ?? []).map((o) => ({
          id: o.uid ?? '',
          name: o.display_name,
          description: '',
        })),
      ),
    );
  }

  createOrganization(name: string, _description: string): Observable<Organization> {
    return this.svc.OrganizationServiceCreateOrganization({ display_name: name }).pipe(
      map((o) => ({ id: o.uid ?? '', name: o.display_name, description: '' })),
    );
  }
}
