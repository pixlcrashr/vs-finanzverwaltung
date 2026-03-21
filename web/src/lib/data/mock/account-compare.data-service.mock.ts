import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import {
  AccountCompareDataService,
  BudgetOption,
  CompareAccountOption,
  CompareAccountTransaction,
} from '../../../app/routes/accounts/account-compare/account-compare.data-service';

@Injectable()
export class MockAccountCompareDataService extends AccountCompareDataService {
  private readonly budgets: BudgetOption[] = (() => {
    const currentYear = new Date().getFullYear();
    return [
      { id: `budget-${currentYear}`, name: `Haushaltsplan ${currentYear}`, year: currentYear },
      {
        id: `budget-${currentYear - 1}`,
        name: `Haushaltsplan ${currentYear - 1}`,
        year: currentYear - 1,
      },
      {
        id: `budget-${currentYear - 2}`,
        name: `Haushaltsplan ${currentYear - 2}`,
        year: currentYear - 2,
      },
    ];
  })();

  private readonly accounts: CompareAccountOption[] = [
    { id: 'acc-bank', code: '1100', name: 'Bank' },
    { id: 'acc-kasse', code: '1200', name: 'Kasse' },
    { id: 'acc-personal', code: '2100', name: 'Personalkosten' },
    { id: 'acc-sachmittel', code: '2200', name: 'Sachmittel' },
    { id: 'acc-events', code: '2300', name: 'Veranstaltungen' },
    { id: 'acc-beitraege', code: '3100', name: 'Mitgliedsbeiträge' },
    { id: 'acc-zuschuesse', code: '3200', name: 'Zuschüsse' },
  ];

  getBudgets(): Observable<BudgetOption[]> {
    return of(this.budgets).pipe(delay(200));
  }

  getAccounts(budgetId: string): Observable<CompareAccountOption[]> {
    const hasBudget = this.budgets.some((budget) => budget.id === budgetId);
    return of(hasBudget ? this.accounts : []).pipe(delay(150));
  }

  getTransactions(
    budgetId: string,
    accountId: string,
  ): Observable<CompareAccountTransaction[]> {
    const budget = this.budgets.find((candidate) => candidate.id === budgetId);
    const account = this.accounts.find((candidate) => candidate.id === accountId);

    if (!budget || !account) {
      return of([]).pipe(delay(150));
    }

    return of(this.generateTransactions(budget.year, account)).pipe(delay(250));
  }

  private generateTransactions(
    year: number,
    account: CompareAccountOption,
  ): CompareAccountTransaction[] {
    const from = new Date(year, 0, 1);
    const to = new Date(year, 11, 31);
    const counterAccounts = this.accounts.filter((candidate) => candidate.id !== account.id);
    const transactionCount = faker.number.int({ min: 6, max: 18 });

    const transactions: CompareAccountTransaction[] = [];

    for (let index = 0; index < transactionCount; index++) {
      const counterAccount = counterAccounts[index % counterAccounts.length];
      const isDebit = index % 2 === 0;

      transactions.push({
        id: `${account.id}-${year}-${index}-${faker.string.alphanumeric(6)}`,
        documentDate: faker.date.between({ from, to }),
        amount: faker.number.float({ min: 50, max: 4500, fractionDigits: 2 }).toFixed(2),
        debitAccountCode: isDebit ? account.code : counterAccount.code,
        creditAccountCode: isDebit ? counterAccount.code : account.code,
        description: faker.helpers.arrayElement([
          'Monatliche Buchung',
          'Ausgleichsbuchung',
          'Projektkosten',
          'Rückerstattung',
          'Plananpassung',
        ]),
      });
    }

    transactions.sort((left, right) => right.documentDate.getTime() - left.documentDate.getTime());

    return transactions;
  }
}
