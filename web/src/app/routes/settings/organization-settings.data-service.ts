import { Observable } from 'rxjs';

export interface OrganizationSettings {
  id: string;
  name: string;
  description?: string;
  defaultCurrency: string;
  fiscalYearStart: number;
  fiscalYearEnd: number;
}

export abstract class OrganizationSettingsDataService {
  abstract getSettings(organizationId: string): Observable<OrganizationSettings>;
  abstract updateSettings(organizationId: string, settings: Partial<OrganizationSettings>): Observable<OrganizationSettings>;
}
