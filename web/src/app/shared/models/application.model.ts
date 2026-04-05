// Application (Antrag) Types

export type ApplicationType = 'general' | 'financial';

export type ApplicationStatus =
  | 'draft'
  | 'queued_for_agenda'
  | 'changes_required'
  | 'rejected'
  | 'accepted'
  | 'completed'
  | 'decayed';

export interface CostItem {
  id: string;
  summary: string;
  description: string | null;
  expectedCost: number; // in cents
  estimatedCost: number; // in cents
  links: string[];
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string;
  lastModifiedByUserId: string;
}

export interface FinancialApplicationDetails {
  suggestedBudgetId: string | null;
  confirmedBudgetId: string | null;
  suggestedBudgetName: string | null;
  confirmedBudgetName: string | null;
  suggestedInvoiceDeadline: Date | null;
  confirmedInvoiceDeadline: Date | null;
  decayDuration: number | null; // days
  decayAt: Date | null;
  costItems: CostItem[];
  totalExpectedCost: number; // in cents
  totalEstimatedCost: number; // in cents
  adminOverrideTotalExpected: number | null;
  adminOverrideTotalEstimated: number | null;
}

export interface Application {
  id: string;
  publicId: string; // Format: "YYYY/XX"
  type: ApplicationType;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string;
  createdByUserFullName: string;
  committeeId: string;
  committeeName: string;
  userGroupId: string | null;
  userGroupName: string | null;
  decisionQuestion: string;
  decisionReason: string;
  status: ApplicationStatus;
  financialDetails: FinancialApplicationDetails | null;
  assignedUserIds: string[];
  assignedUsers: ApplicationAssignedUser[];
}

export interface ApplicationAssignedUser {
  userId: string;
  fullName: string;
}

export interface ApplicationComment {
  id: string;
  applicationId: string;
  authorUserId: string;
  authorUserFullName: string;
  content: string;
  statusChange: {
    from: ApplicationStatus;
    to: ApplicationStatus;
  } | null;
  isAdminOnly: boolean;
  createdAt: Date;
}

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'status_change'
  | 'assign_user'
  | 'unassign_user'
  | 'add_comment'
  | 'add_attachment'
  | 'remove_attachment'
  | 'confirm_original_received';

export interface ApplicationAuditEntry {
  id: string;
  applicationId: string;
  actorUserId: string;
  actorUserFullName: string;
  action: AuditAction;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  timestamp: Date;
}

// Helper functions for status display
export function getApplicationStatusLabel(status: ApplicationStatus): string {
  const labels: Record<ApplicationStatus, string> = {
    draft: $localize`Entwurf`,
    queued_for_agenda: $localize`Zur Tagesordnung`,
    changes_required: $localize`Änderungen erforderlich`,
    rejected: $localize`Abgelehnt`,
    accepted: $localize`Angenommen`,
    completed: $localize`Abgeschlossen`,
    decayed: $localize`Verfallen`,
  };
  return labels[status];
}

export function getApplicationStatusVariant(
  status: ApplicationStatus
): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  const variants: Record<ApplicationStatus, 'success' | 'warning' | 'danger' | 'neutral' | 'info'> = {
    draft: 'neutral',
    queued_for_agenda: 'info',
    changes_required: 'warning',
    rejected: 'danger',
    accepted: 'success',
    completed: 'success',
    decayed: 'neutral',
  };
  return variants[status];
}

export function getApplicationTypeLabel(type: ApplicationType): string {
  const labels: Record<ApplicationType, string> = {
    general: $localize`Allgemeiner Antrag`,
    financial: $localize`Finanzantrag`,
  };
  return labels[type];
}

export function isApplicationEditable(status: ApplicationStatus): boolean {
  return status === 'draft' || status === 'queued_for_agenda' || status === 'changes_required';
}

export function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('de-DE', {
    style: 'currency',
    currency: 'EUR',
  });
}
