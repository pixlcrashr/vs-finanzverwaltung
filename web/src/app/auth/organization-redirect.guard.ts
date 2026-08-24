import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, take } from 'rxjs';
import { MainLayoutDataService } from '../shared/layout/main-layout/main-layout.data-service';
import { CurrentOrganizationService } from '../shared/services/current-organization.service';
import { getMostRecentOrganization } from '../shared/utils/organization.utils';

export const organizationRedirectGuard: CanActivateFn = () => {
  const router = inject(Router);
  const currentOrganizationService = inject(CurrentOrganizationService);
  const dataService = inject(MainLayoutDataService);

  const currentOrg = currentOrganizationService.currentOrganization();
  if (currentOrg) {
    return router.parseUrl(`/organizations/${currentOrg.id}/dashboard`);
  }

  return dataService.getOrganizations().pipe(
    take(1),
    map((orgs) => {
      const defaultOrg = getMostRecentOrganization(orgs);
      if (!defaultOrg) {
        return true;
      }
      return router.parseUrl(`/organizations/${defaultOrg.id}/dashboard`);
    }),
    catchError(() => of(true)),
  );
};
