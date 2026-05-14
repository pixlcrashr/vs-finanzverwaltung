import { computed, Injectable, signal, Signal, WritableSignal } from '@angular/core';
import { Decimal } from 'decimal.js';

@Injectable()
export class MatrixValueStoreService {
  private targetValues = new Map<string, Signal<Decimal>>();
  private actualValues = new Map<string, Signal<Decimal>>();
  private targetWritableValues = new Map<string, WritableSignal<Decimal>>();
  private actualWritableValues = new Map<string, WritableSignal<Decimal>>();

  private getKey(budgetId: string, accountId: string, revisionId: string): string {
    return `${budgetId}-${accountId}-${revisionId}`;
  }

  getTargetValue(budgetId: string, accountId: string, revisionId: string): Signal<Decimal> {
    const key = this.getKey(budgetId, accountId, revisionId);
    const existing = this.targetValues.get(key);
    if (existing) {
      return existing;
    }

    const writable = signal(new Decimal(0));
    const readonly = writable.asReadonly();
    this.targetWritableValues.set(key, writable);
    this.targetValues.set(key, readonly);
    return readonly;
  }

  getActualValue(budgetId: string, accountId: string, revisionId: string): Signal<Decimal> {
    const key = this.getKey(budgetId, accountId, revisionId);
    const existing = this.actualValues.get(key);
    if (existing) {
      return existing;
    }

    const writable = signal(new Decimal(0));
    const readonly = writable.asReadonly();
    this.actualWritableValues.set(key, writable);
    this.actualValues.set(key, readonly);
    return readonly;
  }

  updateTargetValue(budgetId: string, accountId: string, revisionId: string, value: Decimal): void {
    const key = this.getKey(budgetId, accountId, revisionId);
    const s = this.targetWritableValues.get(key);
    if (s) {
      s.set(value);
    } else {
      const writable = signal(value);
      this.targetWritableValues.set(key, writable);
      this.targetValues.set(key, writable.asReadonly());
    }
  }

  updateActualValue(budgetId: string, accountId: string, revisionId: string, value: Decimal): void {
    const key = this.getKey(budgetId, accountId, revisionId);
    const s = this.actualWritableValues.get(key);
    if (s) {
      s.set(value);
    } else {
      const writable = signal(value);
      this.actualWritableValues.set(key, writable);
      this.actualValues.set(key, writable.asReadonly());
    }
  }

  setTargetAggregateValue(
    budgetId: string,
    accountId: string,
    revisionId: string,
    children: Signal<Decimal>[]
  ): Signal<Decimal> {
    const key = this.getKey(budgetId, accountId, revisionId);
    const aggregate = computed(() =>
      children.reduce((sum, child) => sum.plus(child()), new Decimal(0))
    );

    this.targetWritableValues.delete(key);
    this.targetValues.set(key, aggregate);
    return aggregate;
  }

  setActualAggregateValue(
    budgetId: string,
    accountId: string,
    revisionId: string,
    children: Signal<Decimal>[]
  ): Signal<Decimal> {
    const key = this.getKey(budgetId, accountId, revisionId);
    const aggregate = computed(() =>
      children.reduce((sum, child) => sum.plus(child()), new Decimal(0))
    );

    this.actualWritableValues.delete(key);
    this.actualValues.set(key, aggregate);
    return aggregate;
  }
}
