import { Observable } from 'rxjs';

export type JournalImportType = 'lexware' | 'datev';

export interface ImportTransaction {
  customId: string;
  receiptFrom: string;
  bookedAt: string;
  reference: string;
  description: string;
  amount: string;
  debitAccount: string;
  debitAccountName: string;
  creditAccount: string;
  creditAccountName: string;
}

export interface AccountAssignment {
  accountId: string;
  value: string;
}

export interface AccountOption {
  id: string;
  name: string;
  isArchived: boolean;
}

export interface UploadResult {
  success: boolean;
  transactions: ImportTransaction[];
  closedYearsCount: number;
}

export interface ImportSingleTransactionRequest {
  receiptFrom: string;
  bookedAt: string;
  amount: string;
  description: string;
  reference: string;
  debitAccount: string;
  creditAccount: string;
  accountAssignments: AccountAssignment[];
}

export abstract class JournalImportDataService {
  abstract getAvailableAccounts(organizationId: string): Observable<AccountOption[]>;
  abstract uploadFile(organizationId: string, type: JournalImportType, file: File): Observable<UploadResult>;
  abstract importTransaction(organizationId: string, request: ImportSingleTransactionRequest): Observable<{ success: boolean }>;
}
