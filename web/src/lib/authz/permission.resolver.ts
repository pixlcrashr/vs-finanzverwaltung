import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { of } from 'rxjs';
import { Permission } from './permissions';
import { AuthorizationService } from './authorization.service';

export function resolvePermissions(...permissions: Permission[]): ResolveFn<Record<string, boolean>> {
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
    const domain = orgId ? `organizations/${orgId}` : '';

    return authService.checkPermissions(user, domain, permissions);
  };
}

export function resolveGlobalPermissions(...permissions: Permission[]): ResolveFn<Record<string, boolean>> {
  return () => {
    if (permissions.length === 0) {
      return of({});
    }

    const authService = inject(AuthorizationService);

    const user = authService.currentUser();
    if (!user) {
      return of({});
    }

    return authService.checkPermissions(user, '', permissions);
  };
}
