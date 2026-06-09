import { Observable } from 'rxjs';

export interface MonthValue {
  label: string;
  value: number;
}

export interface RootAccountMonthlyData {
  accountId: string;
  accountName: string;
  accountCode: string;
  months: MonthValue[];
}

export interface DashboardStats {
  budgets: {
    open: number;
    closed: number;
    total: number;
  };
  accounts: {
    active: number;
    archived: number;
    total: number;
  };
  transactions: {
    total: number;
    assigned: number;
    unassigned: number;
  };
  rootAccountMonthly: RootAccountMonthlyData[];
}

export abstract class DashboardDataService {
  abstract getStats(organizationId: string): Observable<DashboardStats>;
}
