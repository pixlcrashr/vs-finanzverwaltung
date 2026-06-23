import { Observable, of } from 'rxjs';
import {
  OrganizationSettingsDataService,
  OrganizationSettings,
} from '../../../app/routes/settings/organization-settings.data-service';
import { faker } from '@faker-js/faker';

const mockSettings: Map<string, OrganizationSettings> = new Map();

function createMockSettings(id: string): OrganizationSettings {
  return {
    id,
    name: faker.company.name(),
    description: faker.datatype.boolean() ? faker.company.catchPhrase() : undefined,
    defaultCurrency: 'EUR',
    fiscalYearStart: 1,
    fiscalYearEnd: 12,
  };
}

export class MockOrganizationSettingsDataService implements OrganizationSettingsDataService {
  getSettings(organizationId: string): Observable<OrganizationSettings> {
    if (!mockSettings.has(organizationId)) {
      mockSettings.set(organizationId, createMockSettings(organizationId));
    }
    return of(mockSettings.get(organizationId)!);
  }

  updateSettings(
    organizationId: string,
    settings: Partial<OrganizationSettings>
  ): Observable<OrganizationSettings> {
    const current = mockSettings.get(organizationId) || createMockSettings(organizationId);
    const updated: OrganizationSettings = {
      ...current,
      ...settings,
      id: organizationId,
    };
    mockSettings.set(organizationId, updated);
    return of(updated);
  }
}
