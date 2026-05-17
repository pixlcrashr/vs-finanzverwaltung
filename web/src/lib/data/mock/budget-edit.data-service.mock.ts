import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { faker } from '@faker-js/faker';
import { Decimal } from 'decimal.js';
import { BudgetTag } from '../../../app/shared/models';
import {
  BudgetEditDataService,
  BudgetDetails,
  BudgetChange,
} from '../../../app/routes/budgets/budget-edit/budget-edit.data-service';
import { SharedBudgetMockData } from './_shared-budget-data';

@Injectable()
export class MockBudgetEditDataService extends BudgetEditDataService {
  private sharedData = SharedBudgetMockData.getInstance();

  getBudget(id: string): Observable<BudgetDetails> {
    const data = this.sharedData.getBudgetDetailsOrCreate(id);
    return of({ ...data.budget }).pipe(delay(300));
  }

  updateBudget(
    id: string,
    name: string,
    description: string,
    startDate: Date,
    endDate: Date
  ): Observable<void> {
    const data = this.sharedData.getBudgetDetails(id);

    if (data) {
      data.budget.displayName = name;
      data.budget.displayDescription = description;
      data.budget.periodStart = startDate;
      data.budget.periodEnd = endDate;
      // Changes are account-based and computed by the server
    }
    return of(undefined).pipe(delay(300));
  }

  // Changes are now account-based and computed by the server.
  // In the mock, we keep the existing changes from the shared data.

  addTag(budgetId: string, date: Date, name: string, description: string, force: boolean): Observable<BudgetTag> {
    const data = this.sharedData.getBudgetDetails(budgetId);
    if (!data) {
      return throwError(() => new Error('Budget not found'));
    }

    // If not forcing and no changes exist, return error
    if (!force && !data.budget.hasUntaggedChanges) {
      return throwError(() => new Error('No changes to tag'));
    }

    const tag: BudgetTag = {
      id: faker.string.uuid(),
      name,
      date,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    data.budget.tags.push(tag);

    // Update baseline snapshot to current state
    this.sharedData.updateBaseline(budgetId, {
      displayName: data.budget.displayName,
      displayDescription: data.budget.displayDescription,
      periodStart: data.budget.periodStart,
      periodEnd: data.budget.periodEnd,
    });

    // Reset changes after tagging
    data.budget.hasUntaggedChanges = false;
    data.budget.changes = [];

    return of(tag).pipe(delay(300));
  }

  deleteTag(id: string): Observable<void> {
    const allBudgets = this.sharedData.getAllBudgets();
    for (const budget of allBudgets) {
      const data = this.sharedData.getBudgetDetails(budget.id);
      if (data) {
        const index = data.budget.tags.findIndex((t) => t.id === id);
        if (index >= 0) {
          data.budget.tags.splice(index, 1);
          break;
        }
      }
    }
    return of(undefined).pipe(delay(300));
  }

  closeBudget(id: string): Observable<void> {
    this.sharedData.updateBudget(id, { isClosed: true });
    return of(undefined).pipe(delay(300));
  }
}
