import { Observable } from 'rxjs';
import { V1LedgerAccount } from '../../../../lib/api/models/v1ledger-account';

export interface LedgerAccountListItem {
  id: string;
  code: string;
  displayName: string;
  displayDescription?: string;
  accountType: string;
  updateTime?: string;
}

export interface LedgerAccountListFilter {
  accountType?: string;
  search?: string;
}

export abstract class LedgerAccountListDataService {
  abstract listLedgerAccounts(
    organizationId: string,
    filter?: LedgerAccountListFilter,
    pageToken?: string
  ): Observable<{ accounts: LedgerAccountListItem[]; nextPageToken?: string; totalSize: number }>;
}
