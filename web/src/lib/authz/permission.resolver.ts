import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { V1Permission } from '../api/models/v1permission';
import { AuthorizationService } from './authorization.service';

export function resolvePermissions(...permissions: V1Permission[]): ResolveFn<Record<string, boolean>> {
  return (route) => {
    if (permissions.length === 0) {
      return of({});
    }

    const authService = inject(AuthorizationService);

    const user = authService.currentUser();
    if (!user) {
      return of({});
    }

    const orgId = route.paramMap.get('orgId');
    if (!orgId) {
      return of({});
    }

    return authService.checkPermissions(user, `organizations/${orgId}`, permissions);
  };
}

export function resolveGlobalPermissions(...permissions: V1Permission[]): ResolveFn<Record<string, boolean>> {
  return () => {
    if (permissions.length === 0) {
      return of({});
    }

    const authService = inject(AuthorizationService);

    const user = authService.currentUser();
    if (!user) {
      return of({});
    }

    return authService.checkGlobalPermissions(user, permissions);
  };
}
