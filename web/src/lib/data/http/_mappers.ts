import {
  Account as ApiAccount,
  AccountGroup as ApiAccountGroup,
  AccountGroupAssignment as ApiAccountGroupAssignment,
  Budget as ApiBudget,
  BudgetRevision as ApiBudgetRevision,
  ImportSource as ApiImportSource,
  ImportSourcePeriod as ApiImportSourcePeriod,
  Report as ApiReport,
  ReportTemplate as ApiReportTemplate,
  Transaction as ApiTransaction,
  TransactionAccount as ApiTransactionAccount,
  TransactionAccountAssignment as ApiTransactionAccountAssignment,
} from '../../api/models';

import {
  Account,
  AccountGroup,
  AccountGroupAssignment,
  Budget,
  BudgetRevision,
  ImportSource,
  ImportSourcePeriod,
  Report,
  ReportTemplate,
  Transaction,
  TransactionAccountAssignment,
} from '../../../app/shared/models';

export function toDateOnly(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function mapApiAccountGroup(g: ApiAccountGroup): AccountGroup {
  return {
    id: g.id,
    name: g.displayName,
    description: g.displayDescription,
    assignmentCount: 0,
  };
}

export function mapApiAccount(a: ApiAccount): Account {
  return {
    id: a.id,
    name: a.displayName,
    code: a.displayCode,
    description: a.displayDescription,
    depth: 0,
    isArchived: a.isArchived,
    parentAccountId: a.parentAccountId ?? null,
    children: [],
  };
}

export function buildAccountTree(flatAccounts: Account[]): Account[] {
  const map = new Map<string, Account>();
  const roots: Account[] = [];

  for (const a of flatAccounts) {
    map.set(a.id, { ...a, children: [] });
  }

  for (const a of map.values()) {
    if (a.parentAccountId && map.has(a.parentAccountId)) {
      map.get(a.parentAccountId)!.children.push(a);
    } else {
      roots.push(a);
    }
  }

  function setDepth(accounts: Account[], depth: number): void {
    for (const a of accounts) {
      a.depth = depth;
      setDepth(a.children, depth + 1);
    }
  }
  setDepth(roots, 0);

  return roots;
}

export function mapApiAccountGroupAssignment(
  a: ApiAccountGroupAssignment,
  accountName: string,
  accountCode: string,
): AccountGroupAssignment {
  return {
    id: a.id,
    accountId: a.accountId,
    accountCode,
    accountName,
  };
}

export function mapApiBudget(b: ApiBudget): Budget {
  return {
    id: b.id,
    displayName: b.displayName,
    displayDescription: b.displayDescription,
    periodStart: new Date(b.periodStart),
    periodEnd: new Date(b.periodEnd),
    isClosed: b.isClosed,
  };
}

export function mapApiBudgetRevision(r: ApiBudgetRevision): BudgetRevision {
  return {
    id: r.id,
    date: new Date(r.date),
    description: r.displayDescription,
    createdAt: new Date(r.createTime),
    updatedAt: new Date(r.updateTime),
  };
}

export function mapApiImportSource(
  s: ApiImportSource,
  periods: ImportSourcePeriod[],
): ImportSource {
  return {
    id: s.id,
    name: s.displayName,
    description: s.displayDescription,
    periodStart: new Date(s.periodStart),
    periods,
  };
}

export function mapApiImportSourcePeriod(p: ApiImportSourcePeriod): ImportSourcePeriod {
  return {
    id: p.id,
    year: p.year,
    isClosed: p.isClosed,
    closedAt: p.isClosed ? new Date(p.updateTime) : null,
  };
}

export function mapApiReportTemplate(t: ApiReportTemplate): ReportTemplate {
  return {
    id: t.id,
    name: t.displayName,
    description: '',
    template: t.template,
    createdAt: new Date(t.createTime),
    updatedAt: new Date(t.updateTime),
  };
}

export function mapApiReport(
  r: ApiReport,
  templateId?: string,
  templateName?: string,
): Report {
  return {
    id: r.id,
    name: r.displayName,
    createdAt: new Date(r.createTime),
    templateId: templateId ?? '',
    templateName: templateName ?? '',
  };
}

export function mapApiTransaction(
  t: ApiTransaction,
  debitAccountCode: string,
  debitAccountName: string,
  creditAccountCode: string,
  creditAccountName: string,
  assignments: TransactionAccountAssignment[],
): Transaction {
  return {
    id: t.id,
    documentDate: new Date(t.documentDate),
    bookedAt: new Date(t.bookedAt),
    updatedAt: new Date(t.updateTime),
    amount: t.amount,
    debitAccountId: t.debitTransactionAccountId,
    debitAccountCode,
    debitAccountName,
    creditAccountId: t.creditTransactionAccountId,
    creditAccountCode,
    creditAccountName,
    description: t.description,
    assignedAccountId: null,
    accountAssignments: assignments,
  };
}

export function mapApiTransactionAccountAssignment(
  a: ApiTransactionAccountAssignment,
  accountCode: string,
  accountName: string,
): TransactionAccountAssignment {
  return {
    id: a.id,
    accountId: a.accountId,
    accountCode,
    accountName,
    value: a.value,
  };
}
