import { Observable } from 'rxjs';

export interface CreatedAccountGroup {
  id: string;
  name: string;
  description: string;
}

export abstract class CreateAccountGroupDialogDataService {
  abstract createAccountGroup(
    organizationId: string,
    name: string,
    description: string
  ): Observable<CreatedAccountGroup>;
}
