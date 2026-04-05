import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import {
  listAccountGroups,
  createAccountGroup,
  deleteAccountGroup,
  listAccountGroupAssignments,
} from '../../api/functions';
import { AccountGroup } from '../../../app/shared/models';
import { AccountGroupListDataService } from '../../../app/routes/account-groups/account-group-list/account-group-list.data-service';
import { mapApiAccountGroup } from './_mappers';

@Injectable()
export class HttpAccountGroupListDataService extends AccountGroupListDataService {
  private readonly api = inject(Api);

  getGroups(): Observable<AccountGroup[]> {
    return from(this.api.invoke(listAccountGroups, { pageSize: 100 })).pipe(
      map((resp) => {
        const groups = (resp.accountGroups ?? []).map(mapApiAccountGroup);
        return groups;
      }),
    );
  }

  createGroup(name: string, description: string): Observable<AccountGroup> {
    return from(
      this.api.invoke(createAccountGroup, {
        body: { displayName: name, displayDescription: description },
      }),
    ).pipe(map(mapApiAccountGroup));
  }

  deleteGroup(id: string): Observable<void> {
    return from(
      this.api.invoke(deleteAccountGroup, { accountGroupId: id }),
    ).pipe(map(() => undefined));
  }
}
