import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker/locale/de';
import {
  AddReceiptDialogDataService,
  AddReceiptParams,
} from '../../../app/shared/dialogs/add-receipt-dialog/add-receipt-dialog.data-service';
import { InvoiceItem } from '../../../app/shared/models';

@Injectable()
export class MockAddReceiptDialogDataService extends AddReceiptDialogDataService {
  private receiptCounter = 1;
  private invoiceCounter = 1;

  uploadReceipt(organizationId: string, params: AddReceiptParams): Observable<InvoiceItem> {
    const year = new Date().getFullYear();
    const isReceipt = params.type === 'receipt';
    const counter = isReceipt ? this.receiptCounter++ : this.invoiceCounter++;
    const prefix = isReceipt ? 'R' : 'I';

    const invoiceItem: InvoiceItem = {
      id: faker.string.uuid(),
      publicId: `${prefix}-${year}/${counter.toString().padStart(2, '0')}`,
      reimbursementId: faker.string.uuid(),
      type: params.type,
      description: params.description,
      amount: params.amount,
      attachments: [
        {
          id: faker.string.uuid(),
          invoiceItemId: faker.string.uuid(),
          fileName: params.file.name,
          mimeType: params.file.type,
          fileSize: params.file.size,
          storageKey: faker.string.alphanumeric(32),
          uploadedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      originalReceived: false,
      originalReceivedAt: null,
      originalReceivedByUserId: null,
      originalReceivedByUserName: null,
    };

    return of(invoiceItem).pipe(delay(800));
  }
}
