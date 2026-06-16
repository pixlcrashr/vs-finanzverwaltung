import { Observable } from 'rxjs';
import { V1AccountType } from '../../../../lib/api/models/v1account-type';

export interface LedgerAccountDetail {
  id: string;
  name: string;
  code: string;
  displayName?: string;
  displayDescription?: string;
  accountType: V1AccountType;
  updateTime?: string;
  createTime?: string;
  etag?: string;
}

export interface UpdateLedgerAccountRequest {
  id: string;
  displayName?: string;
  displayDescription?: string;
  etag?: string;
}

export abstract class LedgerAccountEditDataService {
  abstract getLedgerAccount(organizationId: string, id: string): Observable<LedgerAccountDetail>;
  abstract updateLedgerAccount(
    organizationId: string,
    request: UpdateLedgerAccountRequest
  ): Observable<LedgerAccountDetail>;
}
