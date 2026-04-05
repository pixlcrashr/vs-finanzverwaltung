import { Observable } from 'rxjs';
import { CreatedAccount, ParentAccountOption } from './create-account-dialog.component';

export abstract class CreateAccountDialogDataService {
  abstract getParentAccounts(): Observable<ParentAccountOption[]>;
  abstract createAccount(
    name: string,
    code: string,
    description: string,
    parentAccountId: string | null
  ): Observable<CreatedAccount>;
}
