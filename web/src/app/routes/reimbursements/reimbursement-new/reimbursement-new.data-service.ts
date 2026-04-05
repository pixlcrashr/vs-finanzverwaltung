import { Observable } from 'rxjs';
import {
  Reimbursement,
  PaymentMethod,
  BankDetails,
  InvoiceItemType,
} from '../../../shared/models';
import { Committee } from '../../../shared/models';

export interface CreateInvoiceItemParams {
  type: InvoiceItemType;
  description: string | null;
  amount: number; // in cents
}

export interface CreateReimbursementParams {
  committeeId: string;
  notice: string | null;
  paymentMethod: PaymentMethod;
  bankDetails: BankDetails | null;
  invoiceItems: CreateInvoiceItemParams[];
}

export abstract class ReimbursementNewDataService {
  abstract getCommitteeOptions(): Observable<Committee[]>;

  abstract createReimbursement(params: CreateReimbursementParams): Observable<Reimbursement>;
}
