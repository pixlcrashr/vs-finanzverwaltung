import { Observable } from 'rxjs';

export interface OrganizationSettings {
  id: string;
  name: string;
  description?: string;
  fiscalYearStart: number;
}

export type OrganizationSettingsUpdate = {
  name?: string;
  description?: string;
};

export abstract class OrganizationSettingsDataService {
  abstract getSettings(organizationId: string): Observable<OrganizationSettings>;
  abstract updateSettings(organizationId: string, settings: OrganizationSettingsUpdate): Observable<OrganizationSettings>;
}
