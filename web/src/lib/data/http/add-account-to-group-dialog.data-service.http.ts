import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AccountServiceService } from '../../api/services/account-service.service';
import { AccountGroupAssignmentServiceService } from '../../api/services/account-group-assignment-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { AddAccountToGroupDialogDataService } from '../../../app/shared/dialogs/add-account-to-group-dialog/add-account-to-group-dialog.data-service';
import { AvailableAccount } from '../../../app/shared/dialogs/add-account-to-group-dialog/add-account-to-group-dialog.component';

@Injectable()
export class HttpAddAccountToGroupDialogDataService extends AddAccountToGroupDialogDataService {
  private readonly accountSvc = inject(AccountServiceService);
  private readonly assignmentSvc = inject(AccountGroupAssignmentServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get parent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  private groupName(uid: string): string {
    return `${this.parent}/accountGroups/${uid}`;
  }

  getAvailableAccounts(_groupId: string): Observable<AvailableAccount[]> {
    return this.accountSvc.AccountServiceListAccounts({ parent: this.parent, pageSize: 100 }).pipe(
      map((response) =>
        (response.accounts ?? []).map((account) => ({
          id: account.uid ?? '',
          code: account.display_code,
          name: account.display_name,
        })),
      ),
    );
  }

  addAccountToGroup(groupId: string, accountId: string): Observable<void> {
    return this.assignmentSvc.AccountGroupAssignmentServiceCreateAccountGroupAssignment({
      parent: this.groupName(groupId),
      assignment: { account_id: accountId, negate: false },
    }).pipe(map(() => undefined));
  }
}
