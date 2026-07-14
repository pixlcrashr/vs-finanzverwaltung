import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Permission, Permissions } from '../../authz/permissions';
import { AuthorizationDataService } from '../../authz/authorization.service';

@Injectable()
export class MockAuthorizationDataService extends AuthorizationDataService {
  private readonly heldPermissions = new Set<Permission>([
    Permissions.DASHBOARD_READ,
    Permissions.ACCOUNTS_READ,
    Permissions.ACCOUNTS_CREATE,
    Permissions.ACCOUNTS_UPDATE,
    Permissions.ACCOUNT_GROUPS_READ,
    Permissions.ACCOUNT_GROUPS_CREATE,
    Permissions.ACCOUNT_GROUPS_UPDATE,
    Permissions.BUDGETS_READ,
    Permissions.BUDGETS_CREATE,
    Permissions.BUDGETS_UPDATE,
    Permissions.JOURNAL_READ,
    Permissions.JOURNAL_IMPORT,
    Permissions.TRANSACTIONS_READ,
    Permissions.TRANSACTIONS_UPDATE,
    Permissions.MATRIX_READ,
    Permissions.REPORTS_READ,
    Permissions.REPORTS_CREATE,
    Permissions.REPORT_TEMPLATES_READ,
    Permissions.REPORT_TEMPLATES_CREATE,
    Permissions.REPORT_TEMPLATES_UPDATE,
    Permissions.IMPORT_SOURCES_READ,
    Permissions.USERS_READ,
    Permissions.USERS_UPDATE,
    Permissions.GROUPS_READ,
    Permissions.GROUPS_CREATE,
    Permissions.GROUPS_UPDATE,
    Permissions.SETTINGS_READ,
    Permissions.SETTINGS_UPDATE,
  ]);

  checkPermissions(
    user: string,
    domain: string,
    permissions: Permission[],
  ): Observable<Record<string, boolean>> {
    const result: Record<string, boolean> = {};
    for (const p of permissions) {
      result[p] = this.heldPermissions.has(p);
    }
    return of(result).pipe(delay(200));
  }

  batchCheckPermissions(
    requests: { user: string; domain: string; permissions: Permission[] }[],
  ): Observable<Record<string, Record<string, boolean>>> {
    const out: Record<string, Record<string, boolean>> = {};
    for (const req of requests) {
      const perms: Record<string, boolean> = {};
      for (const p of req.permissions) {
        perms[p] = this.heldPermissions.has(p);
      }
      out[req.user] = perms;
    }
    return of(out).pipe(delay(200));
  }
}
