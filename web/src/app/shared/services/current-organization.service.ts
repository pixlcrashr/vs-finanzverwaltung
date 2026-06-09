import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Organization } from '../models';

@Injectable({
  providedIn: 'root',
})
export class CurrentOrganizationService {
  private readonly router = inject(Router);
  private readonly _currentOrganization = signal<Organization | null>(null);

  readonly currentOrganization = this._currentOrganization.asReadonly();
  readonly hasOrganization = computed(() => this._currentOrganization() !== null);

  readonly currentOrganizationId = computed<string | null>(() => {
    const fromSignal = this._currentOrganization()?.id;
    if (fromSignal) return fromSignal;
    return this.router.url.match(/\/organizations\/([^/?#]+)/)?.[1] ?? null;
  });

  setOrganization(organization: Organization | null): void {
    this._currentOrganization.set(organization);
  }
}
