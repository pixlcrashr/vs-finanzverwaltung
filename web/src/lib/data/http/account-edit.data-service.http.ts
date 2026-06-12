import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AccountServiceService } from '../../api/services/account-service.service';
import { Account } from '../../../app/shared/models';
import {
  AccountEditDataService,
  AccountDetails,
} from '../../../app/routes/accounts/account-edit/account-edit.data-service';
import { mapApiAccount } from './_mappers';

@Injectable()
export class HttpAccountEditDataService extends AccountEditDataService {
  private readonly svc = inject(AccountServiceService);

  private accountName(organizationId: string, uid: string): string {
    return `organizations/${organizationId}/accounts/${uid}`;
  }

  getAccount(organizationId: string, id: string): Observable<AccountDetails> {
    return this.svc.AccountServiceGetAccount(this.accountName(organizationId, id)).pipe(
      map((a) => ({
        ...mapApiAccount(a),
        createdAt: new Date(a.create_time ?? ''),
        updatedAt: new Date(a.update_time ?? ''),
      })),
    );
  }

  updateAccount(
    organizationId: string,
    id: string,
    name: string,
    code: string,
    description: string,
  ): Observable<AccountDetails> {
    return this.svc.AccountServiceUpdateAccount({
      accountName: this.accountName(organizationId, id),
      account: { display_name: name, display_code: code, display_description: description },
    }).pipe(
      map((a) => ({
        ...mapApiAccount(a),
        createdAt: new Date(a.create_time ?? ''),
        updatedAt: new Date(a.update_time ?? ''),
      })),
    );
  }

  deleteAccount(organizationId: string, id: string): Observable<void> {
    return this.svc.AccountServiceDeleteAccount(this.accountName(organizationId, id)).pipe(map(() => undefined));
  }

  listParentAccounts(organizationId: string): Observable<Account[]> {
    return this.svc.AccountServiceListAccounts({ parent: `organizations/${organizationId}`, pageSize: 100, showDeleted: false }).pipe(
      map((resp) => (resp.accounts ?? []).map(mapApiAccount)),
    );
  }
}
