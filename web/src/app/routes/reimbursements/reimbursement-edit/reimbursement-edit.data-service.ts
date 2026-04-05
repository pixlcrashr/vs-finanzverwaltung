import { Observable } from 'rxjs';
import {
  Reimbursement,
  ReimbursementComment,
  ReimbursementAuditEntry,
  ReimbursementStatus,
  PaymentMethod,
  BankDetails,
  InvoiceItem,
  InvoiceItemType,
  Attachment,
} from '../../../shared/models';
import { Committee } from '../../../shared/models';

export interface UpdateReimbursementParams {
  committeeId?: string;
  notice?: string | null;
  paymentMethod?: PaymentMethod;
  bankDetails?: BankDetails | null;
}

export interface AddInvoiceItemParams {
  type: InvoiceItemType;
  description: string | null;
  amount: number; // in cents
}

export interface UpdateInvoiceItemParams {
  description?: string | null;
  amount?: number;
}

export interface AddCommentParams {
  content: string;
  isAdminOnly: boolean;
  newStatus?: ReimbursementStatus;
}

export abstract class ReimbursementEditDataService {
  abstract getReimbursement(id: string): Observable<Reimbursement>;

  abstract updateReimbursement(id: string, params: UpdateReimbursementParams): Observable<Reimbursement>;

  abstract changeStatus(id: string, newStatus: ReimbursementStatus, comment?: string): Observable<Reimbursement>;

  // Invoice items
  abstract addInvoiceItem(reimbursementId: string, params: AddInvoiceItemParams): Observable<InvoiceItem>;

  abstract updateInvoiceItem(reimbursementId: string, itemId: string, params: UpdateInvoiceItemParams): Observable<InvoiceItem>;

  abstract deleteInvoiceItem(reimbursementId: string, itemId: string): Observable<void>;

  // Attachments
  abstract uploadAttachment(reimbursementId: string, invoiceItemId: string, file: File): Observable<Attachment>;

  abstract deleteAttachment(reimbursementId: string, invoiceItemId: string, attachmentId: string): Observable<void>;

  // Confirm original receipt received (admin)
  abstract confirmOriginalReceived(reimbursementId: string, invoiceItemId: string): Observable<InvoiceItem>;

  // Comments
  abstract getComments(reimbursementId: string): Observable<ReimbursementComment[]>;

  abstract addComment(reimbursementId: string, params: AddCommentParams): Observable<ReimbursementComment>;

  // Audit log
  abstract getAuditLog(reimbursementId: string): Observable<ReimbursementAuditEntry[]>;

  // Reference data
  abstract getCommittees(): Observable<Committee[]>;
}
