import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AccountGroupServiceService } from '../../api/services/account-group-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { AccountGroup } from '../../../app/shared/models';
import { AccountGroupListDataService } from '../../../app/routes/account-groups/account-group-list/account-group-list.data-service';
import { mapApiAccountGroup } from './_mappers';

@Injectable()
export class HttpAccountGroupListDataService extends AccountGroupListDataService {
  private readonly svc = inject(AccountGroupServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get parent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  private groupName(uid: string): string {
    return `${this.parent}/accountGroups/${uid}`;
  }

  getGroups(): Observable<AccountGroup[]> {
    return this.svc.AccountGroupServiceListAccountGroups({ parent: this.parent, pageSize: 100 }).pipe(
      map((resp) => (resp.account_groups ?? []).map(mapApiAccountGroup)),
    );
  }

  createGroup(name: string, description: string): Observable<AccountGroup> {
    return this.svc.AccountGroupServiceCreateAccountGroup({
      parent: this.parent,
      accountGroup: { display_name: name, display_description: description },
    }).pipe(map(mapApiAccountGroup));
  }

  deleteGroup(id: string): Observable<void> {
    return this.svc.AccountGroupServiceDeleteAccountGroup(this.groupName(id)).pipe(map(() => undefined));
  }
}
