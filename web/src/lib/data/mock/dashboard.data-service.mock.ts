import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import {
  DashboardDataService,
  DashboardStats,
  RootAccountMonthlyData,
  MonthValue,
} from '../../../app/routes/dashboard/dashboard.data-service';

@Injectable()
export class MockDashboardDataService extends DashboardDataService {
  getStats(organizationId: string): Observable<DashboardStats> {
    const openBudgets = faker.number.int({ min: 1, max: 5 });
    const closedBudgets = faker.number.int({ min: 0, max: 10 });
    const activeAccounts = faker.number.int({ min: 10, max: 50 });
    const archivedAccounts = faker.number.int({ min: 0, max: 20 });
    const totalTransactions = faker.number.int({ min: 100, max: 1000 });
    const assignedTransactions = faker.number.int({ min: 50, max: totalTransactions });

    // Generate last 12 months
    const now = new Date();
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    // Generate root account data
    const rootAccountMonthly: RootAccountMonthlyData[] = this.generateRootAccounts(months);

    const stats: DashboardStats = {
      budgets: {
        open: openBudgets,
        closed: closedBudgets,
        total: openBudgets + closedBudgets,
      },
      accounts: {
        active: activeAccounts,
        archived: archivedAccounts,
        total: activeAccounts + archivedAccounts,
      },
      transactions: {
        total: totalTransactions,
        assigned: assignedTransactions,
        unassigned: totalTransactions - assignedTransactions,
      },
      rootAccountMonthly,
    };

    return of(stats).pipe(delay(500));
  }

  private generateRootAccounts(months: string[]): RootAccountMonthlyData[] {
    const accountNames = ['Einnahmen', 'Ausgaben', 'Vermögen', 'Verbindlichkeiten'];
    const accountCodes = ['1', '2', '3', '4'];

    return accountNames.map((name, index) => ({
      accountId: faker.string.uuid(),
      accountName: name,
      accountCode: accountCodes[index],
      months: months.map(
        (label): MonthValue => ({
          label,
          value: faker.number.float({ min: 0, max: 50000, fractionDigits: 2 }),
        })
      ),
    }));
  }
}
