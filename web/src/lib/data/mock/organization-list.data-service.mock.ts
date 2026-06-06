import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { Organization } from '../../../app/shared/models';
import { OrganizationListDataService } from '../../../app/routes/admin/organizations/organization-list.data-service';

@Injectable()
export class MockOrganizationListDataService extends OrganizationListDataService {
  private organizations: Organization[] = this.generateMockOrganizations();

  getOrganizations(): Observable<Organization[]> {
    return of([...this.organizations]).pipe(delay(300));
  }

  deleteOrganization(id: string): Observable<void> {
    this.organizations = this.organizations.filter((org) => org.id !== id);
    return of(undefined).pipe(delay(300));
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
