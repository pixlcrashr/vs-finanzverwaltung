import { Injectable } from '@angular/core';
import { Account, HierarchicalAccount } from '../models';

@Injectable({ providedIn: 'root' })
export class AccountHierarchyService {
  build(flatAccounts: Account[]): HierarchicalAccount[] {
    const map = new Map<string, HierarchicalAccount>();
    const roots: HierarchicalAccount[] = [];

    for (const a of flatAccounts) {
      map.set(a.id, { ...a, depth: 0, children: [] });
    }

    for (const a of map.values()) {
      if (a.parentAccountId && map.has(a.parentAccountId)) {
        map.get(a.parentAccountId)!.children.push(a);
      } else {
        roots.push(a);
      }
    }

    function sortByCode(accounts: HierarchicalAccount[]): void {
      accounts.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' }));
      for (const a of accounts) {
        sortByCode(a.children);
      }
    }

    function setDepth(accounts: HierarchicalAccount[], depth: number): void {
      for (const a of accounts) {
        a.depth = depth;
        setDepth(a.children, depth + 1);
      }
    }

    sortByCode(roots);
    setDepth(roots, 0);

    return roots;
  }
}
