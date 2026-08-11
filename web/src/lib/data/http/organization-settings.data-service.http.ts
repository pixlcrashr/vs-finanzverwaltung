import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { OrganizationServiceService } from '../../api/services/organization-service.service';
import { V1Month } from '../../api/models/v1month';
import {
  OrganizationSettingsDataService,
  OrganizationSettings,
  OrganizationSettingsUpdate,
} from '../../../app/routes/settings/organization-settings.data-service';

const MONTH_TO_NUMBER: Record<V1Month, number> = {
  MONTH_UNSPECIFIED: 0,
  MONTH_JANUARY: 1,
  MONTH_FEBRUARY: 2,
  MONTH_MARCH: 3,
  MONTH_APRIL: 4,
  MONTH_MAY: 5,
  MONTH_JUNE: 6,
  MONTH_JULY: 7,
  MONTH_AUGUST: 8,
  MONTH_SEPTEMBER: 9,
  MONTH_OCTOBER: 10,
  MONTH_NOVEMBER: 11,
  MONTH_DECEMBER: 12,
};

@Injectable()
export class HttpOrganizationSettingsDataService extends OrganizationSettingsDataService {
  private readonly svc = inject(OrganizationServiceService);

  private orgName(id: string): string {
    return `organizations/${id}`;
  }

  getSettings(organizationId: string): Observable<OrganizationSettings> {
    return this.svc.OrganizationServiceGetOrganization(this.orgName(organizationId)).pipe(
      map((o) => ({
        id: organizationId,
        name: o.display_name,
        description: o.display_description ?? '',
        fiscalYearStart: MONTH_TO_NUMBER[o.start_month] ?? 0,
      })),
    );
  }

  updateSettings(
    organizationId: string,
    settings: OrganizationSettingsUpdate,
  ): Observable<OrganizationSettings> {
    return this.svc.OrganizationServiceGetOrganization(this.orgName(organizationId)).pipe(
      switchMap((current) =>
        this.svc.OrganizationServiceUpdateOrganization({
          organizationName: this.orgName(organizationId),
          organization: {
            display_name: settings.name ?? current.display_name,
            display_description: settings.description ?? current.display_description ?? '',
            start_month: current.start_month,
          },
        }),
      ),
      map((o) => ({
        id: organizationId,
        name: o.display_name,
        description: o.display_description ?? '',
        fiscalYearStart: MONTH_TO_NUMBER[o.start_month] ?? 0,
      })),
    );
  }
}
