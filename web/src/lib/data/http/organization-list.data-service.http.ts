import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { OrganizationServiceService } from '../../api/services/organization-service.service';
import { Organization } from '../../../app/shared/models';
import { OrganizationListDataService } from '../../../app/routes/admin/organizations/organization-list.data-service';

@Injectable()
export class HttpOrganizationListDataService extends OrganizationListDataService {
  private readonly svc = inject(OrganizationServiceService);

  getOrganizations(): Observable<Organization[]> {
    return this.svc.OrganizationServiceListOrganizations({ pageSize: 100 }).pipe(
      map((resp) => {
        console.log(resp);
        return (resp.organizations ?? []).map((o) => ({
          id: o.uid ?? '',
          name: o.display_name,
          description: '',
        }));
      }),
    );
  }
}
