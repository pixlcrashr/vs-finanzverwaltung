import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { OrganizationServiceService } from '../../api/services/organization-service.service';
import { Organization } from '../../../app/shared/models';
import {
  OrganizationEditDataService,
  UpdateOrganizationInput,
} from '../../../app/routes/admin/organizations/organization-edit.data-service';

@Injectable()
export class HttpOrganizationEditDataService extends OrganizationEditDataService {
  private readonly svc = inject(OrganizationServiceService);

  private orgName(id: string): string {
    return `organizations/${id}`;
  }

  getOrganization(id: string): Observable<Organization> {
    return this.svc.OrganizationServiceGetOrganization(this.orgName(id)).pipe(
      map((o) => ({ id: o.uid ?? '', name: o.display_name, description: '' })),
    );
  }

  updateOrganization(id: string, input: UpdateOrganizationInput): Observable<Organization> {
    return this.svc.OrganizationServiceUpdateOrganization({
      organizationName: this.orgName(id),
      organization: { display_name: input.name },
    }).pipe(map((o) => ({ id: o.uid ?? '', name: o.display_name, description: '' })));
  }

  deleteOrganization(id: string): Observable<void> {
    return this.svc.OrganizationServiceDeleteOrganization(this.orgName(id)).pipe(
      map(() => undefined),
    );
  }
}
