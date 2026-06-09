import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AccountGroupServiceService } from '../../api/services/account-group-service.service';
import {
  CreateAccountGroupDialogDataService,
  CreatedAccountGroup,
} from '../../../app/shared/dialogs/create-account-group-dialog/create-account-group-dialog.data-service';

@Injectable()
export class HttpCreateAccountGroupDialogDataService extends CreateAccountGroupDialogDataService {
  private readonly svc = inject(AccountGroupServiceService);

  createAccountGroup(organizationId: string, name: string, description: string): Observable<CreatedAccountGroup> {
    const parent = `organizations/${organizationId}`;
    return this.svc.AccountGroupServiceCreateAccountGroup({
      parent,
      accountGroup: { display_name: name, display_description: description },
    }).pipe(
      map((g) => ({
        id: g.uid ?? '',
        name: g.display_name,
        description: g.display_description ?? '',
      })),
    );
  }
}
