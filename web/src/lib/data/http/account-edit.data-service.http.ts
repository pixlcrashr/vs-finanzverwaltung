import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AccountServiceService } from '../../api/services/account-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { Account } from '../../../app/shared/models';
import {
  AccountEditDataService,
  AccountDetails,
} from '../../../app/routes/accounts/account-edit/account-edit.data-service';
import { mapApiAccount } from './_mappers';

@Injectable()
export class HttpAccountEditDataService extends AccountEditDataService {
  private readonly svc = inject(AccountServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get parent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  private accountName(uid: string): string {
    return `${this.parent}/accounts/${uid}`;
  }

  getAccount(id: string): Observable<AccountDetails> {
    return this.svc.AccountServiceGetAccount(this.accountName(id)).pipe(
      map((a) => ({
        ...mapApiAccount(a),
        createdAt: new Date(a.create_time ?? ''),
        updatedAt: new Date(a.update_time ?? ''),
      })),
    );
  }

  updateAccount(
    id: string,
    name: string,
    code: string,
    description: string,
  ): Observable<AccountDetails> {
    return this.svc.AccountServiceUpdateAccount({
      accountName: this.accountName(id),
      account: { display_name: name, display_code: code, display_description: description },
    }).pipe(
      map((a) => ({
        ...mapApiAccount(a),
        createdAt: new Date(a.create_time ?? ''),
        updatedAt: new Date(a.update_time ?? ''),
      })),
    );
  }

  getParentAccounts(): Observable<Account[]> {
    return this.svc.AccountServiceListAccounts({ parent: this.parent, pageSize: 100, showDeleted: false }).pipe(
      map((resp) => (resp.accounts ?? []).map(mapApiAccount)),
    );
  }
}
