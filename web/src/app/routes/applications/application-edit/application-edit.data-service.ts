import { Observable } from 'rxjs';
import {
  Application,
  ApplicationComment,
  ApplicationAuditEntry,
  ApplicationStatus,
  CostItem,
} from '../../../shared/models';
import { Committee, UserGroup } from '../../../shared/models';
import { Budget } from '../../../shared/models';

export interface UpdateApplicationParams {
  committeeId?: string;
  userGroupId?: string | null;
  decisionQuestion?: string;
  decisionReason?: string;
  // Financial application fields
  suggestedBudgetId?: string | null;
  confirmedBudgetId?: string | null;
  suggestedInvoiceDeadline?: Date | null;
  confirmedInvoiceDeadline?: Date | null;
  decayDuration?: number | null;
  adminOverrideTotalExpected?: number | null;
  adminOverrideTotalEstimated?: number | null;
}

export interface AddCostItemParams {
  summary: string;
  description: string | null;
  expectedCost: number;
  estimatedCost: number;
  links: string[];
}

export interface UpdateCostItemParams {
  summary?: string;
  description?: string | null;
  expectedCost?: number;
  estimatedCost?: number;
  links?: string[];
}

export interface AddCommentParams {
  content: string;
  isAdminOnly: boolean;
  newStatus?: ApplicationStatus;
}

export interface AssignedUser {
  userId: string;
  fullName: string;
}

export abstract class ApplicationEditDataService {
  abstract getApplication(id: string): Observable<Application>;

  abstract updateApplication(id: string, params: UpdateApplicationParams): Observable<Application>;

  abstract changeStatus(id: string, newStatus: ApplicationStatus, comment?: string): Observable<Application>;

  // Cost items (financial applications)
  abstract addCostItem(applicationId: string, params: AddCostItemParams): Observable<CostItem>;

  abstract updateCostItem(applicationId: string, costItemId: string, params: UpdateCostItemParams): Observable<CostItem>;

  abstract deleteCostItem(applicationId: string, costItemId: string): Observable<void>;

  // Comments
  abstract getComments(applicationId: string): Observable<ApplicationComment[]>;

  abstract addComment(applicationId: string, params: AddCommentParams): Observable<ApplicationComment>;

  // Audit log
  abstract getAuditLog(applicationId: string): Observable<ApplicationAuditEntry[]>;

  // User assignments (admin)
  abstract getAssignableUsers(): Observable<AssignedUser[]>;

  abstract assignUser(applicationId: string, userId: string): Observable<void>;

  abstract unassignUser(applicationId: string, userId: string): Observable<void>;

  // Reference data
  abstract getCommittees(): Observable<Committee[]>;

  abstract getUserGroups(): Observable<UserGroup[]>;

  abstract getBudgets(): Observable<Budget[]>;
}
