import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker/locale/de';
import {
  Reimbursement,
  ReimbursementStatus,
  PaymentMethod,
  InvoiceItem,
  InvoiceItemType,
  Application,
} from '../../../app/shared/models';
import { Committee } from '../../../app/shared/models';
import {
  ReimbursementListDataService,
  CreateReimbursementParams,
} from '../../../app/routes/reimbursements/reimbursement-list/reimbursement-list.data-service';

@Injectable()
export class MockReimbursementListDataService extends ReimbursementListDataService {
  private reimbursements: Reimbursement[] = this.generateReimbursements();
  private committees: Committee[] = this.generateCommittees();
  private publicIdCounter = 10;
  private receiptCounter = 20;
  private invoiceCounter = 15;

  getReimbursements(filters?: {
    status?: ReimbursementStatus;
    committeeId?: string;
  }): Observable<Reimbursement[]> {
    let result = [...this.reimbursements];

    if (filters?.status) {
      result = result.filter((r) => r.status === filters.status);
    }
    if (filters?.committeeId) {
      result = result.filter((r) => r.committeeId === filters.committeeId);
    }

    return of(result).pipe(delay(300));
  }

  getCommittees(): Observable<Committee[]> {
    return of([...this.committees]).pipe(delay(200));
  }

  getFinancialApplications(): Observable<Application[]> {
    const year = new Date().getFullYear();
    const applications: Application[] = Array.from({ length: 5 }, (_, i) => ({
      id: faker.string.uuid(),
      publicId: `${year}/${String(i + 1).padStart(2, '0')}`,
      type: 'financial' as const,
      createdAt: faker.date.recent({ days: 60 }),
      updatedAt: faker.date.recent({ days: 30 }),
      createdByUserId: faker.string.uuid(),
      createdByUserFullName: faker.person.fullName(),
      committeeId: faker.string.uuid(),
      committeeName: 'AStA',
      userGroupId: null,
      userGroupName: null,
      decisionQuestion: faker.lorem.sentence(),
      decisionReason: faker.lorem.paragraph(),
      status: 'accepted' as const,
      financialDetails: null,
      assignedUserIds: [],
      assignedUsers: [],
    }));

    return of(applications).pipe(delay(200));
  }

  createReimbursement(params: CreateReimbursementParams): Observable<Reimbursement> {
    const year = new Date().getFullYear();
    this.publicIdCounter++;

    const committee = this.committees.find((c) => c.id === params.committeeId);

    const invoiceItems: InvoiceItem[] = params.invoiceItems.map((item) => {
      const isReceipt = item.type === 'receipt';
      const counter = isReceipt ? ++this.receiptCounter : ++this.invoiceCounter;
      const prefix = isReceipt ? 'R' : 'I';

      return {
        id: faker.string.uuid(),
        publicId: `${prefix}-${year}/${String(counter).padStart(2, '0')}`,
        reimbursementId: '', // Will be set after
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
      committeeName: committee?.name || 'Unknown',
      financialApplicationId: params.financialApplicationId,
      financialApplicationPublicId: params.financialApplicationId ? `${year}/01` : null,
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

    this.reimbursements = [newReimbursement, ...this.reimbursements];
    return of(newReimbursement).pipe(delay(300));
  }

  deleteReimbursement(id: string): Observable<void> {
    this.reimbursements = this.reimbursements.filter((r) => r.id !== id);
    return of(undefined).pipe(delay(300));
  }

  private generateReimbursements(): Reimbursement[] {
    const reimbursements: Reimbursement[] = [];
    const statuses: ReimbursementStatus[] = ['pending', 'further_info_required', 'rejected', 'completed'];
    const paymentMethods: PaymentMethod[] = ['bank_transfer', 'cash', 'direct_invoice', 'prepayment'];
    const year = new Date().getFullYear();

    for (let i = 1; i <= 8; i++) {
      const status = statuses[i % statuses.length];
      const paymentMethod = paymentMethods[i % paymentMethods.length];

      const invoiceItems: InvoiceItem[] = Array.from(
        { length: faker.number.int({ min: 1, max: 3 }) },
        (_, j) => {
          const type: InvoiceItemType = faker.helpers.arrayElement(['receipt', 'invoice']);
          const prefix = type === 'receipt' ? 'R' : 'I';
          const counter = type === 'receipt' ? i * 2 + j : i * 2 + j + 10;

          return {
            id: faker.string.uuid(),
            publicId: `${prefix}-${year}/${String(counter).padStart(2, '0')}`,
            reimbursementId: '',
            type,
            description: faker.datatype.boolean() ? faker.commerce.productName() : null,
            amount: faker.number.int({ min: 500, max: 20000 }),
            attachments: faker.datatype.boolean()
              ? [
                  {
                    id: faker.string.uuid(),
                    invoiceItemId: '',
                    fileName: `${type === 'receipt' ? 'kassenbon' : 'rechnung'}_${i}_${j}.pdf`,
                    mimeType: 'application/pdf',
                    fileSize: faker.number.int({ min: 10000, max: 500000 }),
                    storageKey: faker.string.uuid(),
                    uploadedAt: faker.date.recent(),
                  },
                ]
              : [],
            createdAt: faker.date.recent(),
            updatedAt: faker.date.recent(),
            originalReceived: type === 'receipt' && faker.datatype.boolean(),
            originalReceivedAt: type === 'receipt' && faker.datatype.boolean() ? faker.date.recent() : null,
            originalReceivedByUserId: null,
            originalReceivedByUserName: null,
          };
        }
      );

      const reimbursementId = faker.string.uuid();
      invoiceItems.forEach((item) => {
        item.reimbursementId = reimbursementId;
        item.attachments.forEach((att) => {
          att.invoiceItemId = item.id;
        });
      });

      reimbursements.push({
        id: reimbursementId,
        publicId: `${year}/${String(i).padStart(2, '0')}`,
        createdAt: faker.date.recent({ days: 60 }),
        updatedAt: faker.date.recent({ days: 30 }),
        createdByUserId: faker.string.uuid(),
        createdByUserFullName: faker.person.fullName(),
        committeeId: faker.string.uuid(),
        committeeName: 'AStA',
        financialApplicationId: faker.datatype.boolean() ? faker.string.uuid() : null,
        financialApplicationPublicId: faker.datatype.boolean() ? `${year}/${String(faker.number.int({ min: 1, max: 10 })).padStart(2, '0')}` : null,
        notice: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        paymentMethod,
        bankDetails:
          paymentMethod === 'bank_transfer'
            ? {
                iban: faker.finance.iban({ countryCode: 'DE' }),
                bic: faker.finance.bic(),
                accountHolder: faker.person.fullName(),
              }
            : null,
        invoiceItems,
        status,
        totalAmount: invoiceItems.reduce((sum, item) => sum + item.amount, 0),
      });
    }

    return reimbursements;
  }

  private generateCommittees(): Committee[] {
    return [
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
    ];
  }
}
