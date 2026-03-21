import { Observable } from 'rxjs';
import { User } from '../../../shared/models';

export abstract class UserListDataService {
  abstract getUsers(): Observable<User[]>;
}
