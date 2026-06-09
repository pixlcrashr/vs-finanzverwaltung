import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AccountServiceService } from '../../api/services/account-service.service';
import { AccountGroupAssignmentServiceService } from '../../api/services/account-group-assignment-service.service';
import { AddAccountToGroupDialogDataService } from '../../../app/shared/dialogs/add-account-to-group-dialog/add-account-to-group-dialog.data-service';
import { AvailableAccount } from '../../../app/shared/dialogs/add-account-to-group-dialog/add-account-to-group-dialog.component';

@Injectable()
export class HttpAddAccountToGroupDialogDataService extends AddAccountToGroupDialogDataService {
  private readonly accountSvc = inject(AccountServiceService);
  private readonly assignmentSvc = inject(AccountGroupAssignmentServiceService);

  listAvailableAccounts(organizationId: string, _accountGroupId: string): Observable<AvailableAccount[]> {
    return this.accountSvc.AccountServiceListAccounts({ parent: `organizations/${organizationId}`, pageSize: 100 }).pipe(
      map((response) =>
        (response.accounts ?? []).map((account) => ({
          id: account.uid ?? '',
          code: account.display_code,
          name: account.display_name,
        })),
      ),
    );
  }

  addAccountToGroup(organizationId: string, groupId: string, accountId: string): Observable<void> {
    return this.assignmentSvc.AccountGroupAssignmentServiceCreateAccountGroupAssignment({
      parent: `organizations/${organizationId}/accountGroups/${groupId}`,
      assignment: { account_id: accountId, negate: false },
    }).pipe(map(() => undefined));
  }
}
