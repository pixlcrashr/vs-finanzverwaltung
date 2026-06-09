import { Observable } from 'rxjs';
import { AccountGroupStats, Budget, BudgetTag } from '../../../shared/models';

export abstract class AccountGroupStatsDataService {
  abstract listBudgets(organizationId: string): Observable<Budget[]>;
  abstract listBudgetRevisions(organizationId: string, budgetId: string): Observable<BudgetTag[]>;
  abstract getGroupStats(organizationId: string, groupId: string, budgetId: string): Observable<AccountGroupStats>;
  abstract getGroupStatsByRevision(organizationId: string, groupId: string, budgetId: string, budgetRevisionId: string): Observable<AccountGroupStats>;
}
