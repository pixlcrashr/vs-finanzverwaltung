import { Observable } from 'rxjs';

export type JournalAssignmentStatus = 'ignored' | 'assigned' | 'partial' | 'open';

export interface JournalAccountAssignment {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  value: string;
}

export interface JournalEntry {
  id: string;
  documentDate: Date;
  bookedAt: Date;
  amount: string;
  reference: string;
  debitAccountCode: string;
  debitAccountName: string;
  creditAccountCode: string;
  creditAccountName: string;
  description: string;
  assignmentStatus: JournalAssignmentStatus;
  accountAssignments: JournalAccountAssignment[];
}

export interface JournalEntryFilters {
  afterDate?: string;
  beforeDate?: string;
  query?: string;
  assignmentStatus?: 'all' | JournalAssignmentStatus;
}

export abstract class JournalListDataService {
  abstract getEntries(
    page: number,
    pageSize: number,
    filters?: JournalEntryFilters,
  ): Observable<{ entries: JournalEntry[]; total: number }>;
}
