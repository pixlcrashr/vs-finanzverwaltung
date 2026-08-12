import { Observable } from 'rxjs';
import { Account } from '../../../shared/models';
import { JournalAccountAssignment } from './journal-list.data-service';

export interface CreateAssignmentParams {
  accountId: string;
  value: string;
}

export interface UpdateAssignmentParams {
  accountId: string;
  value: string;
}

export abstract class JournalAssignmentEditorDataService {
  abstract listAvailableAccounts(organizationId: string): Observable<Account[]>;

  abstract createAssignment(
    organizationId: string,
    transactionId: string,
    params: CreateAssignmentParams,
  ): Observable<JournalAccountAssignment>;

  abstract updateAssignment(
    organizationId: string,
    transactionId: string,
    assignmentId: string,
    params: UpdateAssignmentParams,
  ): Observable<JournalAccountAssignment>;

  abstract deleteAssignment(
    organizationId: string,
    transactionId: string,
    assignmentId: string,
  ): Observable<void>;
}
