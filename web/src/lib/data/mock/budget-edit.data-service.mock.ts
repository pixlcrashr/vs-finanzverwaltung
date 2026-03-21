import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { faker } from '@faker-js/faker';
import { BudgetRevision } from '../../../app/shared/models';
import {
  BudgetEditDataService,
  BudgetDetails,
} from '../../../app/routes/budgets/budget-edit/budget-edit.data-service';

@Injectable()
export class MockBudgetEditDataService extends BudgetEditDataService {
  private budgets = new Map<string, BudgetDetails>();

  constructor() {
    super();
    // Generate some mock budgets
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      const id = faker.string.uuid();
      const startDate = new Date(year, 0, 1);

      this.budgets.set(id, {
        id,
        displayName: `Haushaltsplan ${year}`,
        displayDescription: faker.lorem.sentence(),
        periodStart: startDate,
        periodEnd: new Date(year, 11, 31),
        isClosed: i > 0,
        revisions: this.generateRevisions(startDate, i > 0 ? 3 : 1),
      });
    }
  }

  getBudget(id: string): Observable<BudgetDetails> {
    // For demo, return a generated budget if not found
    if (!this.budgets.has(id)) {
      const year = new Date().getFullYear();
      const startDate = new Date(year, 0, 1);
      const budget: BudgetDetails = {
        id,
        displayName: `Haushaltsplan ${year}`,
        displayDescription: faker.lorem.sentence(),
        periodStart: startDate,
        periodEnd: new Date(year, 11, 31),
        isClosed: false,
        revisions: this.generateRevisions(startDate, 1),
      };
      this.budgets.set(id, budget);
    }

    return of({ ...this.budgets.get(id)! }).pipe(delay(300));
  }

  updateBudget(
    id: string,
    name: string,
    description: string,
    startDate: Date,
    endDate: Date
  ): Observable<void> {
    const budget = this.budgets.get(id);
    if (budget) {
      budget.displayName = name;
      budget.displayDescription = description;
      budget.periodStart = startDate;
      budget.periodEnd = endDate;
    }
    return of(undefined).pipe(delay(300));
  }

  addRevision(budgetId: string, date: Date, description: string): Observable<BudgetRevision> {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      return throwError(() => new Error('Budget not found'));
    }

    const revision: BudgetRevision = {
      id: faker.string.uuid(),
      date,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    budget.revisions.push(revision);
    return of(revision).pipe(delay(300));
  }

  updateRevision(id: string, date: Date, description: string): Observable<void> {
    for (const budget of this.budgets.values()) {
      const revision = budget.revisions.find((r) => r.id === id);
      if (revision) {
        revision.date = date;
        revision.description = description;
        revision.updatedAt = new Date();
        break;
      }
    }
    return of(undefined).pipe(delay(300));
  }

  deleteRevision(id: string): Observable<void> {
    for (const budget of this.budgets.values()) {
      const index = budget.revisions.findIndex((r) => r.id === id);
      if (index >= 0) {
        budget.revisions.splice(index, 1);
        break;
      }
    }
    return of(undefined).pipe(delay(300));
  }

  closeBudget(id: string): Observable<void> {
    const budget = this.budgets.get(id);
    if (budget) {
      budget.isClosed = true;
    }
    return of(undefined).pipe(delay(300));
  }

  private generateRevisions(startDate: Date, count: number): BudgetRevision[] {
    const revisions: BudgetRevision[] = [];

    for (let i = 0; i < count; i++) {
      const revisionDate = new Date(startDate);
      revisionDate.setMonth(revisionDate.getMonth() + i * 3);

      revisions.push({
        id: faker.string.uuid(),
        date: revisionDate,
        description: i === 0 ? 'Ursprünglicher Plan' : `Revision ${i}`,
        createdAt: revisionDate,
        updatedAt: revisionDate,
      });
    }

    return revisions;
  }
}
