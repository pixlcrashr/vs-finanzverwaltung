import { Observable } from 'rxjs';
import {
  Reimbursement,
  ReimbursementStatus,
  PaymentMethod,
  BankDetails,
  InvoiceItemType,
} from '../../../shared/models';
import { Committee } from '../../../shared/models';
import { Application } from '../../../shared/models';

export interface CreateInvoiceItemParams {
  type: InvoiceItemType;
  description: string | null;
  amount: number; // in cents
}

export interface CreateReimbursementParams {
  committeeId: string;
  financialApplicationId: string | null;
  notice: string | null;
  paymentMethod: PaymentMethod;
  bankDetails: BankDetails | null;
  invoiceItems: CreateInvoiceItemParams[];
}

export abstract class ReimbursementListDataService {
  abstract getReimbursements(filters?: {
    status?: ReimbursementStatus;
    committeeId?: string;
  }): Observable<Reimbursement[]>;

  abstract getCommittees(): Observable<Committee[]>;

  // For selecting financial applications when creating reimbursement
  abstract getFinancialApplications(): Observable<Application[]>;

  abstract createReimbursement(params: CreateReimbursementParams): Observable<Reimbursement>;

  abstract deleteReimbursement(id: string): Observable<void>;
}
