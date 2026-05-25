import { Observable } from 'rxjs';
import { AccountGroupStats, Budget, BudgetTag } from '../../../shared/models';

export abstract class AccountGroupStatsDataService {
  abstract getBudgets(): Observable<Budget[]>;
  abstract getBudgetTags(budgetId: string): Observable<BudgetTag[]>;
  abstract getGroupStats(groupId: string, budgetId: string): Observable<AccountGroupStats>;
  abstract getGroupStatsByTag(groupId: string, budgetId: string, tagId: string): Observable<AccountGroupStats>;
}
