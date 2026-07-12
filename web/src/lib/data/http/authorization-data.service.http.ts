import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { UserServiceService } from '../../api/services/user-service.service';
import { V1Permission } from '../../api/models/v1permission';
import { AuthorizationDataService } from '../../authz/authorization.service';

@Injectable()
export class HttpAuthorizationDataService extends AuthorizationDataService {
  private readonly userService = inject(UserServiceService);

  checkPermissions(
    user: string,
    organization: string,
    permissions: V1Permission[],
  ): Observable<Record<string, boolean>> {
    return this.userService
      .UserServiceCheckUserOrganizationPermissions({
        name: user,
        body: {
          organization,
          permissions,
        },
      })
      .pipe(
        map((response) => {
          const held = new Set(response.permitted ?? []);
          const result: Record<string, boolean> = {};
          for (const p of permissions) {
            result[p] = held.has(p);
          }
          return result;
        }),
      );
  }

  checkGlobalPermissions(
    user: string,
    permissions: V1Permission[],
  ): Observable<Record<string, boolean>> {
    return this.userService
      .UserServiceCheckUserPermissions({
        name: user,
        body: {
          permissions,
        },
      })
      .pipe(
        map((response) => {
          const held = new Set(response.permitted ?? []);
          const result: Record<string, boolean> = {};
          for (const p of permissions) {
            result[p] = held.has(p);
          }
          return result;
        }),
      );
  }

  batchCheckGlobalPermissions(
    requests: { user: string; permissions: V1Permission[] }[],
  ): Observable<Record<string, Record<string, boolean>>> {
    return this.userService
      .UserServiceBatchCheckUserPermissions({
        requests: requests.map((r) => ({
          name: r.user,
          permissions: r.permissions,
        })),
      })
      .pipe(
        map((response) => {
          const out: Record<string, Record<string, boolean>> = {};
          response.results?.forEach((result, i) => {
            const req = requests[i];
            const held = new Set(result.permitted ?? []);
            const perms: Record<string, boolean> = {};
            for (const p of req.permissions) {
              perms[p] = held.has(p);
            }
            out[req.user] = perms;
          });
          return out;
        }),
      );
  }
}
