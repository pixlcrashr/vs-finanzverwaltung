import { Observable } from 'rxjs';
import { AvailableAccount } from './add-account-to-group-dialog.component';

export abstract class AddAccountToGroupDialogDataService {
  abstract listAvailableAccounts(organizationId: string, accountGroupId: string): Observable<AvailableAccount[]>;
  abstract addAccountToGroup(organizationId: string, accountGroupId: string, accountId: string): Observable<void>;
}
