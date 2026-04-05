import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker/locale/de';
import {
  Reimbursement,
  ReimbursementComment,
  ReimbursementAuditEntry,
  ReimbursementStatus,
  PaymentMethod,
  InvoiceItem,
  InvoiceItemType,
  Attachment,
  Application,
} from '../../../app/shared/models';
import { Committee } from '../../../app/shared/models';
import {
  ReimbursementEditDataService,
  UpdateReimbursementParams,
  AddInvoiceItemParams,
  UpdateInvoiceItemParams,
  AddCommentParams,
} from '../../../app/routes/reimbursements/reimbursement-edit/reimbursement-edit.data-service';

@Injectable()
export class MockReimbursementEditDataService extends ReimbursementEditDataService {
  private reimbursements: Map<string, Reimbursement> = new Map();
  private comments: Map<string, ReimbursementComment[]> = new Map();
  private auditLogs: Map<string, ReimbursementAuditEntry[]> = new Map();
  private receiptCounter = 50;
  private invoiceCounter = 40;

  getReimbursement(id: string): Observable<Reimbursement> {
    if (!this.reimbursements.has(id)) {
      this.reimbursements.set(id, this.generateReimbursement(id));
      this.comments.set(id, this.generateComments(id));
      this.auditLogs.set(id, this.generateAuditLog(id));
    }
    return of(this.reimbursements.get(id)!).pipe(delay(300));
  }

  updateReimbursement(id: string, params: UpdateReimbursementParams): Observable<Reimbursement> {
    const reimbursement = this.reimbursements.get(id);
    if (reimbursement) {
      Object.assign(reimbursement, params);
      reimbursement.updatedAt = new Date();
      this.addAuditEntry(id, 'update', 'reimbursement', null, JSON.stringify(params));
    }
    return of(reimbursement!).pipe(delay(300));
  }

  changeStatus(id: string, newStatus: ReimbursementStatus, comment?: string): Observable<Reimbursement> {
    const reimbursement = this.reimbursements.get(id);
    if (reimbursement) {
      const oldStatus = reimbursement.status;
      reimbursement.status = newStatus;
      reimbursement.updatedAt = new Date();
      this.addAuditEntry(id, 'status_change', 'status', oldStatus, newStatus);

      if (comment) {
        this.addCommentInternal(id, {
          content: comment,
          isAdminOnly: false,
          newStatus,
        }, oldStatus);
      }
    }
    return of(reimbursement!).pipe(delay(300));
  }

  addInvoiceItem(reimbursementId: string, params: AddInvoiceItemParams): Observable<InvoiceItem> {
    const reimbursement = this.reimbursements.get(reimbursementId);
    const year = new Date().getFullYear();

    const isReceipt = params.type === 'receipt';
    const counter = isReceipt ? ++this.receiptCounter : ++this.invoiceCounter;
    const prefix = isReceipt ? 'R' : 'I';

    const newItem: InvoiceItem = {
      id: faker.string.uuid(),
      publicId: `${prefix}-${year}/${String(counter).padStart(2, '0')}`,
      reimbursementId,
      type: params.type,
      description: params.description,
      amount: params.amount,
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      originalReceived: false,
      originalReceivedAt: null,
      originalReceivedByUserId: null,
      originalReceivedByUserName: null,
    };

    if (reimbursement) {
      reimbursement.invoiceItems.push(newItem);
      this.recalculateTotal(reimbursement);
    }

    this.addAuditEntry(reimbursementId, 'create', 'invoice_item', null, JSON.stringify(newItem));
    return of(newItem).pipe(delay(300));
  }

  updateInvoiceItem(reimbursementId: string, itemId: string, params: UpdateInvoiceItemParams): Observable<InvoiceItem> {
    const reimbursement = this.reimbursements.get(reimbursementId);
    let updatedItem: InvoiceItem | undefined;

    if (reimbursement) {
      const item = reimbursement.invoiceItems.find((i) => i.id === itemId);
      if (item) {
        const oldValue = JSON.stringify(item);
        Object.assign(item, params);
        item.updatedAt = new Date();
        updatedItem = item;
        this.recalculateTotal(reimbursement);
        this.addAuditEntry(reimbursementId, 'update', 'invoice_item', oldValue, JSON.stringify(item));
      }
    }

    return of(updatedItem!).pipe(delay(300));
  }

  deleteInvoiceItem(reimbursementId: string, itemId: string): Observable<void> {
    const reimbursement = this.reimbursements.get(reimbursementId);
    if (reimbursement) {
      reimbursement.invoiceItems = reimbursement.invoiceItems.filter((i) => i.id !== itemId);
      this.recalculateTotal(reimbursement);
      this.addAuditEntry(reimbursementId, 'delete', 'invoice_item', itemId, null);
    }
    return of(undefined).pipe(delay(300));
  }

  uploadAttachment(reimbursementId: string, invoiceItemId: string, file: File): Observable<Attachment> {
    const reimbursement = this.reimbursements.get(reimbursementId);
    const newAttachment: Attachment = {
      id: faker.string.uuid(),
      invoiceItemId,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      storageKey: faker.string.uuid(),
      uploadedAt: new Date(),
    };

    if (reimbursement) {
      const item = reimbursement.invoiceItems.find((i) => i.id === invoiceItemId);
      if (item) {
        item.attachments.push(newAttachment);
      }
    }

    this.addAuditEntry(reimbursementId, 'add_attachment', 'attachment', null, newAttachment.fileName);
    return of(newAttachment).pipe(delay(500));
  }

  deleteAttachment(reimbursementId: string, invoiceItemId: string, attachmentId: string): Observable<void> {
    const reimbursement = this.reimbursements.get(reimbursementId);
    if (reimbursement) {
      const item = reimbursement.invoiceItems.find((i) => i.id === invoiceItemId);
      if (item) {
        const attachment = item.attachments.find((a) => a.id === attachmentId);
        item.attachments = item.attachments.filter((a) => a.id !== attachmentId);
        this.addAuditEntry(reimbursementId, 'remove_attachment', 'attachment', attachment?.fileName || '', null);
      }
    }
    return of(undefined).pipe(delay(300));
  }

  confirmOriginalReceived(reimbursementId: string, invoiceItemId: string): Observable<InvoiceItem> {
    const reimbursement = this.reimbursements.get(reimbursementId);
    let updatedItem: InvoiceItem | undefined;

    if (reimbursement) {
      const item = reimbursement.invoiceItems.find((i) => i.id === invoiceItemId);
      if (item && item.type === 'receipt') {
        item.originalReceived = true;
        item.originalReceivedAt = new Date();
        item.originalReceivedByUserId = faker.string.uuid();
        item.originalReceivedByUserName = faker.person.fullName();
        item.updatedAt = new Date();
        updatedItem = item;
        this.addAuditEntry(reimbursementId, 'confirm_original_received', 'invoice_item', 'false', 'true');
      }
    }

    return of(updatedItem!).pipe(delay(300));
  }

  getComments(reimbursementId: string): Observable<ReimbursementComment[]> {
    if (!this.comments.has(reimbursementId)) {
      this.comments.set(reimbursementId, this.generateComments(reimbursementId));
    }
    return of([...this.comments.get(reimbursementId)!]).pipe(delay(200));
  }

  addComment(reimbursementId: string, params: AddCommentParams): Observable<ReimbursementComment> {
    const reimbursement = this.reimbursements.get(reimbursementId);
    const oldStatus = reimbursement?.status;
    return of(this.addCommentInternal(reimbursementId, params, oldStatus)).pipe(delay(300));
  }

  private addCommentInternal(reimbursementId: string, params: AddCommentParams, oldStatus?: ReimbursementStatus): ReimbursementComment {
    const newComment: ReimbursementComment = {
      id: faker.string.uuid(),
      reimbursementId,
      authorUserId: faker.string.uuid(),
      authorUserFullName: faker.person.fullName(),
      content: params.content,
      statusChange: params.newStatus && oldStatus
        ? { from: oldStatus, to: params.newStatus }
        : null,
      isAdminOnly: params.isAdminOnly,
      createdAt: new Date(),
    };

    if (!this.comments.has(reimbursementId)) {
      this.comments.set(reimbursementId, []);
    }
    this.comments.get(reimbursementId)!.push(newComment);
    this.addAuditEntry(reimbursementId, 'add_comment', null, null, newComment.id);

    return newComment;
  }

  getAuditLog(reimbursementId: string): Observable<ReimbursementAuditEntry[]> {
    if (!this.auditLogs.has(reimbursementId)) {
      this.auditLogs.set(reimbursementId, this.generateAuditLog(reimbursementId));
    }
    return of([...this.auditLogs.get(reimbursementId)!]).pipe(delay(200));
  }

  getCommittees(): Observable<Committee[]> {
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

  private generateReimbursement(id: string): Reimbursement {
    const status: ReimbursementStatus = faker.helpers.arrayElement(['pending', 'further_info_required', 'completed']);
    const paymentMethod: PaymentMethod = faker.helpers.arrayElement(['bank_transfer', 'cash', 'direct_invoice', 'prepayment']);
    const year = new Date().getFullYear();

    const invoiceItems: InvoiceItem[] = Array.from(
      { length: faker.number.int({ min: 1, max: 4 }) },
      (_, j) => {
        const type: InvoiceItemType = faker.helpers.arrayElement(['receipt', 'invoice']);
        const prefix = type === 'receipt' ? 'R' : 'I';
        const counter = j + 1;

        return {
          id: faker.string.uuid(),
          publicId: `${prefix}-${year}/${String(counter).padStart(2, '0')}`,
          reimbursementId: id,
          type,
          description: faker.datatype.boolean() ? faker.commerce.productName() : null,
          amount: faker.number.int({ min: 500, max: 20000 }),
          attachments: faker.datatype.boolean()
            ? [
                {
                  id: faker.string.uuid(),
                  invoiceItemId: '',
                  fileName: `${type === 'receipt' ? 'kassenbon' : 'rechnung'}.pdf`,
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

    return {
      id,
      publicId: `${year}/${faker.number.int({ min: 1, max: 99 }).toString().padStart(2, '0')}`,
      createdAt: faker.date.recent({ days: 60 }),
      updatedAt: faker.date.recent({ days: 30 }),
      createdByUserId: faker.string.uuid(),
      createdByUserFullName: faker.person.fullName(),
      committeeId: faker.string.uuid(),
      committeeName: 'AStA',
      financialApplicationId: faker.datatype.boolean() ? faker.string.uuid() : null,
      financialApplicationPublicId: faker.datatype.boolean() ? `${year}/01` : null,
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
    };
  }

  private generateComments(reimbursementId: string): ReimbursementComment[] {
    return Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => ({
      id: faker.string.uuid(),
      reimbursementId,
      authorUserId: faker.string.uuid(),
      authorUserFullName: faker.person.fullName(),
      content: faker.lorem.paragraph(),
      statusChange: faker.datatype.boolean()
        ? { from: 'pending' as ReimbursementStatus, to: 'completed' as ReimbursementStatus }
        : null,
      isAdminOnly: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
    }));
  }

  private generateAuditLog(reimbursementId: string): ReimbursementAuditEntry[] {
    const actions = ['create', 'update', 'status_change', 'add_attachment'];
    return Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => ({
      id: faker.string.uuid(),
      reimbursementId,
      actorUserId: faker.string.uuid(),
      actorUserFullName: faker.person.fullName(),
      action: faker.helpers.arrayElement(actions),
      fieldName: faker.datatype.boolean() ? 'status' : null,
      oldValue: faker.datatype.boolean() ? 'pending' : null,
      newValue: faker.datatype.boolean() ? 'completed' : null,
      timestamp: faker.date.recent(),
    }));
  }

  private addAuditEntry(
    reimbursementId: string,
    action: string,
    fieldName: string | null,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (!this.auditLogs.has(reimbursementId)) {
      this.auditLogs.set(reimbursementId, []);
    }
    this.auditLogs.get(reimbursementId)!.push({
      id: faker.string.uuid(),
      reimbursementId,
      actorUserId: faker.string.uuid(),
      actorUserFullName: faker.person.fullName(),
      action,
      fieldName,
      oldValue,
      newValue,
      timestamp: new Date(),
    });
  }

  private recalculateTotal(reimbursement: Reimbursement): void {
    reimbursement.totalAmount = reimbursement.invoiceItems.reduce((sum, item) => sum + item.amount, 0);
  }
}
