import { inject, Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import { createAccountGroup } from '../../api/functions';
import {
  CreateAccountGroupDialogDataService,
  CreatedAccountGroup,
} from '../../../app/shared/dialogs/create-account-group-dialog/create-account-group-dialog.data-service';

@Injectable()
export class HttpCreateAccountGroupDialogDataService extends CreateAccountGroupDialogDataService {
  private readonly api = inject(Api);

  createAccountGroup(name: string, description: string): Observable<CreatedAccountGroup> {
    return from(
      this.api.invoke(createAccountGroup, {
        body: {
          displayName: name,
          displayDescription: description,
        },
      })
    ).pipe(
      map((response) => ({
        id: response.id,
        name: response.displayName,
        description: response.displayDescription,
      }))
    );
  }
}
