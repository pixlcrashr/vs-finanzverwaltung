import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { OrganizationServiceService } from '../../api/services/organization-service.service';
import { V1Month } from '../../api/models/v1month';
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

  createOrganization(name: string, description: string, organizationId?: string, startMonth?: number): Observable<CreatedOrganization> {
    const monthNames: V1Month[] = [
      'MONTH_JANUARY', 'MONTH_FEBRUARY', 'MONTH_MARCH', 'MONTH_APRIL',
      'MONTH_MAY', 'MONTH_JUNE', 'MONTH_JULY', 'MONTH_AUGUST',
      'MONTH_SEPTEMBER', 'MONTH_OCTOBER', 'MONTH_NOVEMBER', 'MONTH_DECEMBER',
    ];
    const startMonthStr: V1Month = monthNames[(startMonth ?? 1) - 1] || 'MONTH_JANUARY';

    return this.svc.OrganizationServiceCreateOrganization({
      organization: { display_name: name, start_month: startMonthStr },
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
