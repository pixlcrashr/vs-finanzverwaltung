import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  LedgerAccountEditDataService,
  LedgerAccountDetail,
  UpdateLedgerAccountRequest,
} from '../../../app/routes/ledger/ledger-accounts/ledger-account-edit.data-service';
import { LedgerAccountServiceService } from '../../api/services/ledger-account-service.service';
import { V1AccountType } from '../../api/models/v1account-type';

@Injectable({ providedIn: 'root' })
export class HttpLedgerAccountEditDataService implements LedgerAccountEditDataService {
  constructor(private readonly api: LedgerAccountServiceService) {}

  getLedgerAccount(organizationId: string, id: string): Observable<LedgerAccountDetail> {
    const name = `organizations/${organizationId}/ledgerAccounts/${id}`;
    return this.api.LedgerAccountServiceGetLedgerAccount(name).pipe(
      map((account) => ({
        id: account.uid || '',
        name: account.name || '',
        code: account.code,
        displayName: account.display_name,
        displayDescription: account.display_description,
        accountType: account.account_type as V1AccountType,
        updateTime: account.update_time,
        createTime: account.create_time,
        etag: account.etag,
      }))
    );
  }

  updateLedgerAccount(
    organizationId: string,
    request: UpdateLedgerAccountRequest
  ): Observable<LedgerAccountDetail> {
    const ledgerAccountName = `organizations/${organizationId}/ledgerAccounts/${request.id}`;
    
    return this.api
      .LedgerAccountServiceUpdateLedgerAccount({
        ledgerAccountName,
        ledgerAccount: {
          uid: request.id,
          code: '',
          account_type: 'ACCOUNT_TYPE_UNSPECIFIED' as V1AccountType,
          display_name: request.displayName,
          display_description: request.displayDescription,
          etag: request.etag,
        },
      })
      .pipe(
        map((account) => ({
          id: account.uid || '',
          name: account.name || '',
          code: account.code,
          displayName: account.display_name,
          displayDescription: account.display_description,
          accountType: account.account_type as V1AccountType,
          updateTime: account.update_time,
          createTime: account.create_time,
          etag: account.etag,
        }))
      );
  }
}
