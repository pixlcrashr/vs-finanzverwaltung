import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { CreateOrganizationDialogDataService } from '../../../app/shared/dialogs/create-organization-dialog/create-organization-dialog.data-service';
import { CreatedOrganization } from '../../../app/shared/dialogs/create-organization-dialog/create-organization-dialog.component';

@Injectable()
export class MockCreateOrganizationDialogDataService extends CreateOrganizationDialogDataService {
  isOrganizationIdAvailable(_organizationId: string): Observable<boolean> {
    return of(true).pipe(delay(100));
  }

  createOrganization(name: string, description: string, customId?: string): Observable<CreatedOrganization> {
    return of({
      id: faker.string.uuid(),
      name,
      description,
    }).pipe(delay(300));
  }
}
