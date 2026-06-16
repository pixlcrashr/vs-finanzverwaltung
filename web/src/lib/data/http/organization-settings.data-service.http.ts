import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  OrganizationSettingsDataService,
  OrganizationSettings,
} from '../../../app/routes/settings/organization-settings.data-service';

// NOTE: This is a placeholder implementation.
// The organization settings API may need to be added to the backend.
// For now, this returns mock data until the API is available.

@Injectable({ providedIn: 'root' })
export class HttpOrganizationSettingsDataService implements OrganizationSettingsDataService {
  getSettings(organizationId: string): Observable<OrganizationSettings> {
    // TODO: Replace with actual API call when available
    return of({
      id: organizationId,
      name: 'Organization ' + organizationId,
      defaultCurrency: 'EUR',
      fiscalYearStart: 1,
      fiscalYearEnd: 12,
    });
  }

  updateSettings(
    organizationId: string,
    settings: Partial<OrganizationSettings>
  ): Observable<OrganizationSettings> {
    // TODO: Replace with actual API call when available
    return of({
      id: organizationId,
      name: settings.name || 'Organization ' + organizationId,
      description: settings.description,
      defaultCurrency: 'EUR',
      fiscalYearStart: settings.fiscalYearStart ?? 1,
      fiscalYearEnd: settings.fiscalYearEnd ?? 12,
    });
  }
}
