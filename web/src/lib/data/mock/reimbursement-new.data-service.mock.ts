import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker/locale/de';
import {
  Reimbursement,
  InvoiceItem,
} from '../../../app/shared/models';
import { Committee } from '../../../app/shared/models';
import {
  ReimbursementNewDataService,
  CreateReimbursementParams,
} from '../../../app/routes/reimbursements/reimbursement-new/reimbursement-new.data-service';

@Injectable()
export class MockReimbursementNewDataService extends ReimbursementNewDataService {
  private publicIdCounter = 20;
  private receiptCounter = 30;
  private invoiceCounter = 25;

  getCommitteeOptions(): Observable<Committee[]> {
    return of([
      {
        id: faker.string.uuid(),
        name: 'AStA',
        description: 'Allgemeiner Studierendenausschuss',
        isActive: true,
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      },
      {
        id: faker.string.uuid(),
        name: 'StuPa',
        description: 'Studierendenparlament',
        isActive: true,
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      },
    ]).pipe(delay(200));
  }

  createReimbursement(params: CreateReimbursementParams): Observable<Reimbursement> {
    const year = new Date().getFullYear();
    this.publicIdCounter++;

    const invoiceItems: InvoiceItem[] = params.invoiceItems.map((item) => {
      const isReceipt = item.type === 'receipt';
      const counter = isReceipt ? ++this.receiptCounter : ++this.invoiceCounter;
      const prefix = isReceipt ? 'R' : 'I';

      return {
        id: faker.string.uuid(),
        publicId: `${prefix}-${year}/${String(counter).padStart(2, '0')}`,
        reimbursementId: '',
        type: item.type,
        description: item.description,
        amount: item.amount,
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        originalReceived: false,
        originalReceivedAt: null,
        originalReceivedByUserId: null,
        originalReceivedByUserName: null,
      };
    });

    const newReimbursement: Reimbursement = {
      id: faker.string.uuid(),
      publicId: `${year}/${String(this.publicIdCounter).padStart(2, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdByUserId: faker.string.uuid(),
      createdByUserFullName: faker.person.fullName(),
      committeeId: params.committeeId,
      committeeName: 'AStA',
      financialApplicationId: null,
      financialApplicationPublicId: null,
      notice: params.notice,
      paymentMethod: params.paymentMethod,
      bankDetails: params.bankDetails,
      invoiceItems: invoiceItems.map((item) => ({ ...item, reimbursementId: '' })),
      status: 'pending',
      totalAmount: invoiceItems.reduce((sum, item) => sum + item.amount, 0),
    };

    // Update reimbursement IDs in invoice items
    newReimbursement.invoiceItems.forEach((item) => {
      item.reimbursementId = newReimbursement.id;
    });

    return of(newReimbursement).pipe(delay(300));
  }
}
