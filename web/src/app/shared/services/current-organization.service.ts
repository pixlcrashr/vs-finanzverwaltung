import { Injectable, signal, computed } from '@angular/core';
import { Organization } from '../models';

@Injectable({
  providedIn: 'root',
})
export class CurrentOrganizationService {
  private readonly _currentOrganization = signal<Organization | null>(null);

  readonly currentOrganization = this._currentOrganization.asReadonly();
  readonly hasOrganization = computed(() => this._currentOrganization() !== null);

  setOrganization(organization: Organization | null): void {
    this._currentOrganization.set(organization);
  }
}
