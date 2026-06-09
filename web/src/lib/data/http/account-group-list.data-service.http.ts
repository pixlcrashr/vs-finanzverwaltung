import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AccountGroupServiceService } from '../../api/services/account-group-service.service';
import { AccountGroup } from '../../../app/shared/models';
import { AccountGroupListDataService } from '../../../app/routes/account-groups/account-group-list/account-group-list.data-service';
import { mapApiAccountGroup } from './_mappers';

@Injectable()
export class HttpAccountGroupListDataService extends AccountGroupListDataService {
  private readonly svc = inject(AccountGroupServiceService);

  private groupName(organizationId: string, uid: string): string {
    return `organizations/${organizationId}/accountGroups/${uid}`;
  }

  listGroups(organizationId: string): Observable<AccountGroup[]> {
    return this.svc.AccountGroupServiceListAccountGroups({ parent: `organizations/${organizationId}`, pageSize: 100 }).pipe(
      map((resp) => (resp.account_groups ?? []).map(mapApiAccountGroup)),
    );
  }

  createGroup(organizationId: string, name: string, description: string): Observable<AccountGroup> {
    return this.svc.AccountGroupServiceCreateAccountGroup({
      parent: `organizations/${organizationId}`,
      accountGroup: { display_name: name, display_description: description },
    }).pipe(map(mapApiAccountGroup));
  }

  deleteGroup(organizationId: string, id: string): Observable<void> {
    return this.svc.AccountGroupServiceDeleteAccountGroup(this.groupName(organizationId, id)).pipe(map(() => undefined));
  }
}
