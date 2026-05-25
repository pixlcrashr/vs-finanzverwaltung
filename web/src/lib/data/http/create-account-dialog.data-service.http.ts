import { inject, Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import { listAccounts, createAccount } from '../../api/functions';
import { CreateAccountDialogDataService } from '../../../app/shared/dialogs/create-account-dialog/create-account-dialog.data-service';
import {
  CreatedAccount,
  ParentAccountOption,
} from '../../../app/shared/dialogs/create-account-dialog/create-account-dialog.component';

interface FlatAccount {
  id: string;
  code: string;
  name: string;
  parentAccountId: string | null;
}

@Injectable()
export class HttpCreateAccountDialogDataService extends CreateAccountDialogDataService {
  private readonly api = inject(Api);

  getParentAccounts(): Observable<ParentAccountOption[]> {
    return from(
      this.api.invoke(listAccounts, { pageSize: 1000, showDeleted: false })
    ).pipe(
      map((response) => {
        const flat: FlatAccount[] = (response.accounts ?? []).map((a) => ({
          id: a.id,
          code: a.displayCode,
          name: a.displayName,
          parentAccountId: a.parentAccountId ?? null,
        }));
        return this.buildHierarchicalList(flat);
      })
    );
  }

  private buildHierarchicalList(flat: FlatAccount[]): ParentAccountOption[] {
    const childrenMap = new Map<string | null, FlatAccount[]>();
    for (const a of flat) {
      const key = a.parentAccountId;
      if (!childrenMap.has(key)) childrenMap.set(key, []);
      childrenMap.get(key)!.push(a);
    }

    const result: ParentAccountOption[] = [];
    const traverse = (parentId: string | null, depth: number) => {
      const children = childrenMap.get(parentId) ?? [];
      for (const child of children) {
        result.push({ id: child.id, code: child.code, name: child.name, depth });
        traverse(child.id, depth + 1);
      }
    };
    traverse(null, 0);
    return result;
  }

  createAccount(
    name: string,
    code: string,
    description: string,
    parentAccountId: string | null
  ): Observable<CreatedAccount> {
    return from(
      this.api.invoke(createAccount, {
        body: {
          displayName: name,
          displayCode: code,
          displayDescription: description,
          parentAccountId: parentAccountId ?? undefined,
        },
      })
    ).pipe(
      map((response) => ({
        id: response.id,
        code: response.displayCode,
        name: response.displayName,
        description: response.displayDescription,
        parentAccountId: response.parentAccountId ?? null,
      }))
    );
  }
}
