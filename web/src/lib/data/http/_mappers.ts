import {
  V1Account as ApiAccount,
  V1AccountGroup as ApiAccountGroup,
  V1AccountGroupAssignment as ApiAccountGroupAssignment,
  V1Budget as ApiBudget,
  V1BudgetRevision as ApiBudgetRevision,
  V1ImportSource as ApiImportSource,
  V1ImportSourcePeriod as ApiImportSourcePeriod,
  V1Report as ApiReport,
  V1ReportTemplate as ApiReportTemplate,
  V1Transaction as ApiTransaction,
  V1TransactionAccount as ApiTransactionAccount,
  V1TransactionAccountAssignment as ApiTransactionAccountAssignment,
} from '../../api/models';

import {
  Account,
  AccountGroup,
  AccountGroupAssignment,
  Budget,
  BudgetRevision,
  BudgetTag,
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

export function typeDateToDate(d: { year?: number; month?: number; day?: number }): Date {
  return new Date(d.year ?? 0, (d.month ?? 1) - 1, d.day ?? 1);
}

export function dateToTypeDate(d: Date): { year: number; month: number; day: number } {
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

export function mapApiAccountGroup(g: ApiAccountGroup): AccountGroup {
  return {
    id: g.uid ?? '',
    name: g.display_name,
    description: g.display_description ?? '',
    assignmentCount: 0,
  };
}

export function mapApiAccount(a: ApiAccount): Account {
  const parentUid = a.parent_account ? a.parent_account.split('/').pop() ?? null : null;
  return {
    id: a.uid ?? '',
    name: a.display_name,
    code: a.display_code,
    fullCode: a.display_code,
    description: a.display_description ?? '',
    depth: 0,
    isArchived: a.is_archived ?? false,
    parentAccountId: parentUid,
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

  function sortByCode(accounts: Account[]): void {
    accounts.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' }));
    for (const a of accounts) {
      sortByCode(a.children);
    }
  }

  function setDepth(accounts: Account[], depth: number): void {
    for (const a of accounts) {
      a.depth = depth;
      setDepth(a.children, depth + 1);
    }
  }
  sortByCode(roots);
  setDepth(roots, 0);

  return roots;
}

export function mapApiAccountGroupAssignment(
  a: ApiAccountGroupAssignment,
  accountName: string,
  accountCode: string,
): AccountGroupAssignment {
  return {
    id: a.uid ?? '',
    accountId: a.account_id,
    accountCode,
    accountName,
    operation: a.negate ? 'S' : 'A',
    targetValue: '0',
    actualValue: '0',
  };
}

export function mapApiBudget(b: ApiBudget): Budget {
  return {
    id: b.uid ?? '',
    displayName: b.display_name,
    displayDescription: b.display_description ?? '',
    periodStart: typeDateToDate(b.period_start),
    periodEnd: typeDateToDate(b.period_end),
    isClosed: b.is_closed ?? false,
  };
}

export function mapApiBudgetRevision(r: ApiBudgetRevision): BudgetRevision {
  return {
    id: r.uid ?? '',
    date: r.date ? typeDateToDate(r.date) : new Date(),
    description: r.display_description ?? '',
    createdAt: new Date(r.create_time ?? ''),
    updatedAt: new Date(r.create_time ?? ''),
  };
}

export function mapApiBudgetTag(r: ApiBudgetRevision): BudgetTag {
  const date = r.date ? typeDateToDate(r.date) : new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const formattedDate = `${day}.${month}.${year}`;

  return {
    id: r.uid ?? '',
    name: formattedDate,
    date,
    description: r.display_description ?? '',
    createdAt: new Date(r.create_time ?? ''),
    updatedAt: new Date(r.create_time ?? ''),
  };
}

export function mapApiImportSource(
  s: ApiImportSource,
  periods: ImportSourcePeriod[],
): ImportSource {
  return {
    id: s.uid ?? '',
    name: s.display_name,
    description: s.display_description ?? '',
    periodStart: typeDateToDate(s.period_start),
    periods,
  };
}

export function mapApiImportSourcePeriod(p: ApiImportSourcePeriod): ImportSourcePeriod {
  return {
    id: p.uid ?? '',
    year: p.year,
    isClosed: p.is_closed ?? false,
    closedAt: p.is_closed ? new Date(p.update_time ?? '') : null,
  };
}

export function mapApiReportTemplate(t: ApiReportTemplate): ReportTemplate {
  return {
    id: t.uid ?? '',
    name: t.display_name,
    description: '',
    template: t.template,
    createdAt: new Date(t.create_time ?? ''),
    updatedAt: new Date(t.update_time ?? ''),
  };
}

export function mapApiReport(
  r: ApiReport,
  templateId?: string,
  templateName?: string,
): Report {
  return {
    id: r.uid ?? '',
    name: r.display_name,
    createdAt: new Date(r.create_time ?? ''),
    templateId: templateId ?? r.report_template_id ?? '',
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
    id: t.uid ?? '',
    documentDate: new Date(t.document_date),
    bookedAt: new Date(t.booked_at),
    updatedAt: new Date(t.update_time ?? ''),
    amount: t.amount?.value ?? '',
    debitAccountId: t.debit_transaction_account_id,
    debitAccountCode,
    debitAccountName,
    creditAccountId: t.credit_transaction_account_id,
    creditAccountCode,
    creditAccountName,
    description: t.description ?? '',
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
    id: a.uid ?? '',
    accountId: a.account_id,
    accountCode,
    accountName,
    value: a.value?.value ?? '',
  };
}
