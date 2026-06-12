import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { Organization } from '../../../app/shared/models';
import { MainLayoutDataService } from '../../../app/shared/layout/main-layout/main-layout.data-service';

@Injectable()
export class MockMainLayoutDataService extends MainLayoutDataService {
  private organizations: Organization[] = [
    {
      id: 'default',
      name: 'Verein Musterstadt',
      description: 'Der fiktive Musterverein für Demonstrationszwecke',
    },
  ];

  getOrganizations(): Observable<Organization[]> {
    return of([...this.organizations]).pipe(delay(300));
  }
}
