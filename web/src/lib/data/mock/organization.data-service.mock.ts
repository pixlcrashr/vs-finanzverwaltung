import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { Organization } from '../../../app/shared/models';
import { OrganizationDataService } from '../../../app/shared/services/organization.data-service';

@Injectable()
export class MockOrganizationDataService extends OrganizationDataService {
  private organizations: Organization[] = this.generateMockOrganizations();

  getOrganizations(): Observable<Organization[]> {
    return of([...this.organizations]).pipe(delay(300));
  }

  createOrganization(name: string, description: string): Observable<Organization> {
    const newOrganization: Organization = {
      id: faker.string.uuid(),
      name,
      description,
    };

    this.organizations = [newOrganization, ...this.organizations];
    return of(newOrganization).pipe(delay(300));
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
