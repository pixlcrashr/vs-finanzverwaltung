import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import {
  CreateAccountGroupDialogDataService,
  CreatedAccountGroup,
} from '../../../app/shared/dialogs/create-account-group-dialog/create-account-group-dialog.data-service';

@Injectable()
export class MockCreateAccountGroupDialogDataService extends CreateAccountGroupDialogDataService {
  createAccountGroup(name: string, description: string): Observable<CreatedAccountGroup> {
    return of({
      id: faker.string.uuid(),
      name,
      description,
    }).pipe(delay(500));
  }
}
