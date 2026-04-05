import { Observable } from 'rxjs';
import { AvailableAccount } from './add-account-to-group-dialog.component';

export abstract class AddAccountToGroupDialogDataService {
  abstract getAvailableAccounts(groupId: string): Observable<AvailableAccount[]>;
  abstract addAccountToGroup(groupId: string, accountId: string): Observable<void>;
}
