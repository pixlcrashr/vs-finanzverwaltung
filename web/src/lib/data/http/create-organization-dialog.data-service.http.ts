import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { OrganizationServiceService } from '../../api/services/organization-service.service';
import { CreateOrganizationDialogDataService } from '../../../app/shared/dialogs/create-organization-dialog/create-organization-dialog.data-service';
import { CreatedOrganization } from '../../../app/shared/dialogs/create-organization-dialog/create-organization-dialog.component';

@Injectable()
export class HttpCreateOrganizationDialogDataService extends CreateOrganizationDialogDataService {
  private readonly svc = inject(OrganizationServiceService);

  isOrganizationIdAvailable(organizationId: string): Observable<boolean> {
    return this.svc.OrganizationServiceCheckOrganizationId({ organization_id: organizationId }).pipe(
      map((resp) => resp.available ?? false),
    );
  }

  createOrganization(name: string, description: string, organizationId?: string): Observable<CreatedOrganization> {
    return this.svc.OrganizationServiceCreateOrganization({
      organization: { display_name: name, start_month: 'MONTH_JANUARY' },
      organizationId: organizationId
    }).pipe(
      map((o) => ({
        id: o.uid ?? '',
        name: o.display_name,
        description,
      })),
    );
  }
}
