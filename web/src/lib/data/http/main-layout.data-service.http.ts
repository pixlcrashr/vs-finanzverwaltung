import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { OrganizationServiceService } from '../../api/services/organization-service.service';
import { Organization } from '../../../app/shared/models';
import { MainLayoutDataService } from '../../../app/shared/layout/main-layout/main-layout.data-service';

@Injectable()
export class HttpMainLayoutDataService extends MainLayoutDataService {
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
}
