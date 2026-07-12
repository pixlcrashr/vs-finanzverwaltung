import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { V1Permission } from '../api/models/v1permission';
import { AuthorizationService } from './authorization.service';

export function requireAllPermissions(...requiredPermissions: V1Permission[]): CanActivateFn {
  return (route) => {
    if (requiredPermissions.length === 0) {
      return true;
    }

    const authService = inject(AuthorizationService);
    const router = inject(Router);

    const user = authService.currentUser();
    if (!user) {
      return router.createUrlTree(['/']);
    }

    const orgId = route.paramMap.get('orgId');
    if (!orgId) {
      return true;
    }

    return authService.checkPermissions(user, `organizations/${orgId}`, requiredPermissions).pipe(
      map((result) => {
        const allGranted = requiredPermissions.every((p) => result[p]);
        return allGranted || router.createUrlTree(['/']);
      }),
    );
  };
}

export function requireAnyPermission(...permissions: V1Permission[]): CanActivateFn {
  return (route) => {
    if (permissions.length === 0) {
      return true;
    }

    const authService = inject(AuthorizationService);
    const router = inject(Router);

    const user = authService.currentUser();
    if (!user) {
      return router.createUrlTree(['/']);
    }

    const orgId = route.paramMap.get('orgId');
    if (!orgId) {
      return true;
    }

    return authService.checkPermissions(user, `organizations/${orgId}`, permissions).pipe(
      map((result) => {
        const anyGranted = permissions.some((p) => result[p]);
        return anyGranted || router.createUrlTree(['/']);
      }),
    );
  };
}
