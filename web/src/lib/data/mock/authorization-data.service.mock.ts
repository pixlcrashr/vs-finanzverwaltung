import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { V1Permission } from '../../api/models/v1permission';
import { AuthorizationDataService } from '../../authz/authorization.service';

@Injectable()
export class MockAuthorizationDataService extends AuthorizationDataService {
  private readonly heldPermissions = new Set<V1Permission>([
    V1Permission.PERMISSION_DASHBOARD_READ,
    V1Permission.PERMISSION_ACCOUNTS_READ,
    V1Permission.PERMISSION_ACCOUNTS_CREATE,
    V1Permission.PERMISSION_ACCOUNTS_UPDATE,
    V1Permission.PERMISSION_ACCOUNT_GROUPS_READ,
    V1Permission.PERMISSION_ACCOUNT_GROUPS_CREATE,
    V1Permission.PERMISSION_ACCOUNT_GROUPS_UPDATE,
    V1Permission.PERMISSION_BUDGETS_READ,
    V1Permission.PERMISSION_BUDGETS_CREATE,
    V1Permission.PERMISSION_BUDGETS_UPDATE,
    V1Permission.PERMISSION_JOURNAL_READ,
    V1Permission.PERMISSION_JOURNAL_IMPORT,
    V1Permission.PERMISSION_TRANSACTIONS_READ,
    V1Permission.PERMISSION_TRANSACTIONS_UPDATE,
    V1Permission.PERMISSION_MATRIX_READ,
    V1Permission.PERMISSION_REPORTS_READ,
    V1Permission.PERMISSION_REPORTS_CREATE,
    V1Permission.PERMISSION_REPORT_TEMPLATES_READ,
    V1Permission.PERMISSION_REPORT_TEMPLATES_CREATE,
    V1Permission.PERMISSION_REPORT_TEMPLATES_UPDATE,
    V1Permission.PERMISSION_IMPORT_SOURCES_READ,
    V1Permission.PERMISSION_USERS_READ,
    V1Permission.PERMISSION_USERS_UPDATE,
    V1Permission.PERMISSION_GROUPS_READ,
    V1Permission.PERMISSION_GROUPS_CREATE,
    V1Permission.PERMISSION_GROUPS_UPDATE,
    V1Permission.PERMISSION_SETTINGS_READ,
    V1Permission.PERMISSION_SETTINGS_UPDATE,
  ]);

  checkPermissions(
    user: string,
    organization: string,
    permissions: V1Permission[],
  ): Observable<Record<string, boolean>> {
    const result: Record<string, boolean> = {};
    for (const p of permissions) {
      result[p] = this.heldPermissions.has(p);
    }
    return of(result).pipe(delay(200));
  }
}
