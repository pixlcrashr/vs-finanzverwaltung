import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Organization } from '../../../app/shared/models';
import { OrganizationEditDataService, UpdateOrganizationInput } from '../../../app/routes/admin/organizations/organization-edit.data-service';

@Injectable()
export class MockOrganizationEditDataService extends OrganizationEditDataService {
  private organizations: Organization[] = this.generateMockOrganizations();

  getOrganization(id: string): Observable<Organization> {
    const org = this.organizations.find((o) => o.id === id);
    if (!org) {
      throw new Error(`Organization with id ${id} not found`);
    }
    return of({ ...org }).pipe(delay(300));
  }

  updateOrganization(id: string, input: UpdateOrganizationInput): Observable<Organization> {
    const index = this.organizations.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error(`Organization with id ${id} not found`);
    }
    const updated = {
      ...this.organizations[index],
      name: input.name,
      description: input.description,
    };
    this.organizations[index] = updated;
    return of({ ...updated }).pipe(delay(300));
  }

  private generateMockOrganizations(): Organization[] {
    return [
      {
        id: 'default',
        name: 'Verein Musterstadt',
        description: 'Der fiktive Musterverein für Demonstrationszwecke',
      },
    ];
  }
}
