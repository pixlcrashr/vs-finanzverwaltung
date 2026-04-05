// Reimbursement (Kostenerstattung) Types

export type ReimbursementStatus =
  | 'pending'
  | 'further_info_required'
  | 'rejected'
  | 'completed';

export type PaymentMethod = 'bank_transfer' | 'cash' | 'direct_invoice' | 'prepayment';

export type InvoiceItemType = 'receipt' | 'invoice';

export interface BankDetails {
  iban: string;
  bic: string | null;
  accountHolder: string;
}

export interface Attachment {
  id: string;
  invoiceItemId: string;
  fileName: string;
  mimeType: string;
  fileSize: number; // bytes
  storageKey: string;
  uploadedAt: Date;
}

export interface InvoiceItem {
  id: string;
  publicId: string; // Format: "R-YYYY/ZZ" or "I-YYYY/ZZ"
  reimbursementId: string;
  type: InvoiceItemType;
  description: string | null;
  amount: number; // in cents
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
  // Receipt-specific
  originalReceived: boolean;
  originalReceivedAt: Date | null;
  originalReceivedByUserId: string | null;
  originalReceivedByUserName: string | null;
}

export interface Reimbursement {
  id: string;
  publicId: string; // Format: "YYYY/XX"
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string;
  createdByUserFullName: string;
  committeeId: string;
  committeeName: string;
  financialApplicationId: string | null;
  financialApplicationPublicId: string | null;
  notice: string | null;
  paymentMethod: PaymentMethod;
  bankDetails: BankDetails | null;
  invoiceItems: InvoiceItem[];
  status: ReimbursementStatus;
  totalAmount: number; // calculated sum of invoice items in cents
}

export interface ReimbursementComment {
  id: string;
  reimbursementId: string;
  authorUserId: string;
  authorUserFullName: string;
  content: string;
  statusChange: {
    from: ReimbursementStatus;
    to: ReimbursementStatus;
  } | null;
  isAdminOnly: boolean;
  createdAt: Date;
}

export interface ReimbursementAuditEntry {
  id: string;
  reimbursementId: string;
  actorUserId: string;
  actorUserFullName: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  timestamp: Date;
}

// Helper functions for status display
export function getReimbursementStatusLabel(status: ReimbursementStatus): string {
  const labels: Record<ReimbursementStatus, string> = {
    pending: $localize`Ausstehend`,
    further_info_required: $localize`Weitere Informationen erforderlich`,
    rejected: $localize`Abgelehnt`,
    completed: $localize`Abgeschlossen`,
  };
  return labels[status];
}

export function getReimbursementStatusVariant(
  status: ReimbursementStatus
): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  const variants: Record<ReimbursementStatus, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
    pending: 'info',
    further_info_required: 'warning',
    rejected: 'danger',
    completed: 'success',
  };
  return variants[status];
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    bank_transfer: $localize`Überweisung (IBAN/BIC)`,
    cash: $localize`Barzahlung`,
    direct_invoice: $localize`Direktüberweisung an Rechnungssteller`,
    prepayment: $localize`Vorkasse`,
  };
  return labels[method];
}

export function getInvoiceItemTypeLabel(type: InvoiceItemType): string {
  const labels: Record<InvoiceItemType, string> = {
    receipt: $localize`Kassenbon`,
    invoice: $localize`Rechnung`,
  };
  return labels[type];
}

// formatCurrency is exported from application.model.ts
