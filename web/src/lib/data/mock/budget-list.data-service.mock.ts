import { Injectable } from '@angular/core';
import { Observable, of, delay, map } from 'rxjs';
import { faker } from '@faker-js/faker';
import { Budget } from '../../../app/shared/models';
import { BudgetListDataService } from '../../../app/routes/budgets/budget-list/budget-list.data-service';

@Injectable()
export class MockBudgetListDataService extends BudgetListDataService {
  private budgets: Budget[] = this.generateBudgets();

  getBudgets(): Observable<Budget[]> {
    return of([...this.budgets]).pipe(delay(300));
  }

  createBudget(
    name: string,
    description: string,
    startDate: Date,
    endDate: Date
  ): Observable<Budget> {
    const newBudget: Budget = {
      id: faker.string.uuid(),
      displayName: name,
      displayDescription: description,
      periodStart: startDate,
      periodEnd: endDate,
      isClosed: false,
    };

    this.budgets = [newBudget, ...this.budgets];

    return of(newBudget).pipe(delay(300));
  }

  deleteBudget(id: string): Observable<void> {
    this.budgets = this.budgets.filter((b) => b.id !== id);
    return of(undefined).pipe(delay(300));
  }

  private generateBudgets(): Budget[] {
    const budgets: Budget[] = [];
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      budgets.push({
        id: faker.string.uuid(),
        displayName: `Haushaltsplan ${year}`,
        displayDescription: faker.lorem.sentence(),
        periodStart: startDate,
        periodEnd: endDate,
        isClosed: i > 0, // Current year is open, previous years are closed
      });
    }

    return budgets;
  }
}
