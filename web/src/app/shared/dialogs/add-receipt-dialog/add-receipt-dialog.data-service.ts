import { Observable } from 'rxjs';
import { InvoiceItem, InvoiceItemType } from '../../models';

export interface AddReceiptParams {
  type: InvoiceItemType;
  amount: number; // in cents
  description: string | null;
  file: File;
}

export abstract class AddReceiptDialogDataService {
  abstract uploadReceipt(params: AddReceiptParams): Observable<InvoiceItem>;
}
