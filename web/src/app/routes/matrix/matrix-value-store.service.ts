import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { Decimal } from 'decimal.js';

export interface ChangedValue {
  accountId: string;
  value: Decimal;
}

@Injectable()
export class MatrixValueStoreService {
  private editableTargetReadSignals = new Map<string, Signal<Decimal>>();
  private editableTargetWriteSignals = new Map<string, WritableSignal<Decimal>>();
  private originalValues = new Map<string, Decimal>();
  private budgetAccountKeys = new Map<string, Set<string>>(); // budgetId -> Set of keys

  private getKey(budgetId: string, accountId: string): string {
    return `${budgetId}|${accountId}`;
  }

  private trackBudgetKey(budgetId: string, key: string): void {
    const keys = this.budgetAccountKeys.get(budgetId) ?? new Set();
    keys.add(key);
    this.budgetAccountKeys.set(budgetId, keys);
  }

  private parseKey(key: string): { budgetId: string; accountId: string } | null {
    const separatorIndex = key.indexOf('|');
    if (separatorIndex === -1) return null;
    return {
      budgetId: key.substring(0, separatorIndex),
      accountId: key.substring(separatorIndex + 1)
    };
  }

  getEditableTargetValue(budgetId: string, accountId: string): Signal<Decimal> {
    const key = this.getKey(budgetId, accountId);
    const existing = this.editableTargetReadSignals.get(key);
    if (existing) {
      return existing;
    }

    const writable = signal(new Decimal(0));
    this.editableTargetWriteSignals.set(key, writable);
    this.editableTargetReadSignals.set(key, writable);
    return writable;
  }

  updateEditableTargetValue(budgetId: string, accountId: string, value: Decimal, isInitial = false): void {
    const key = this.getKey(budgetId, accountId);
    this.trackBudgetKey(budgetId, key);

    if (isInitial || !this.originalValues.has(key)) {
      this.originalValues.set(key, value);
    }

    const s = this.editableTargetWriteSignals.get(key);
    if (s) {
      s.set(value);
    } else {
      const writable = signal(value);
      this.editableTargetWriteSignals.set(key, writable);
      this.editableTargetReadSignals.set(key, writable);
    }
  }

  setEditableTargetAggregateValue(
    budgetId: string,
    accountId: string,
    children: Signal<Decimal>[]
  ): Signal<Decimal> {
    const key = this.getKey(budgetId, accountId);
    const aggregate = computed(() =>
      children.reduce((sum, child) => sum.plus(child()), new Decimal(0))
    );

    this.editableTargetWriteSignals.delete(key);
    this.editableTargetReadSignals.set(key, aggregate);
    return aggregate;
  }

  hasChanged(budgetId: string, accountId: string): boolean {
    const key = this.getKey(budgetId, accountId);
    const original = this.originalValues.get(key);
    const current = this.editableTargetWriteSignals.get(key)?.();
    if (original === undefined || current === undefined) {
      return false;
    }
    return !original.equals(current);
  }

  getChangedValuesByBudget(budgetId: string): ChangedValue[] {
    const keys = this.budgetAccountKeys.get(budgetId);
    if (!keys) {
      return [];
    }

    const changedValues: ChangedValue[] = [];
    for (const key of keys) {
      const parsed = this.parseKey(key);
      if (!parsed) continue;

      const original = this.originalValues.get(key);
      const current = this.editableTargetWriteSignals.get(key)?.();
      if (original === undefined || current === undefined) continue;

      if (!original.equals(current)) {
        changedValues.push({
          accountId: parsed.accountId,
          value: current
        });
      }
    }

    return changedValues;
  }

  getAllChangedValues(): Map<string, ChangedValue[]> {
    const result = new Map<string, ChangedValue[]>();
    for (const budgetId of this.budgetAccountKeys.keys()) {
      const changedValues = this.getChangedValuesByBudget(budgetId);
      if (changedValues.length > 0) {
        result.set(budgetId, changedValues);
      }
    }
    return result;
  }

  hasChangedValues(budgetId?: string): boolean {
    if (budgetId) {
      return this.getChangedValuesByBudget(budgetId).length > 0;
    }
    for (const bid of this.budgetAccountKeys.keys()) {
      if (this.getChangedValuesByBudget(bid).length > 0) {
        return true;
      }
    }
    return false;
  }

  markAsClean(budgetId: string, accountId?: string): void {
    if (accountId) {
      const key = this.getKey(budgetId, accountId);
      const current = this.editableTargetWriteSignals.get(key)?.();
      if (current !== undefined) {
        this.originalValues.set(key, current);
      }
    } else {
      const keys = this.budgetAccountKeys.get(budgetId);
      if (!keys) return;

      for (const key of keys) {
        const current = this.editableTargetWriteSignals.get(key)?.();
        if (current !== undefined) {
          this.originalValues.set(key, current);
        }
      }
    }
  }

  markAllAsClean(): void {
    for (const budgetId of this.budgetAccountKeys.keys()) {
      this.markAsClean(budgetId);
    }
  }

  resetToOriginal(budgetId: string, accountId?: string): void {
    if (accountId) {
      const key = this.getKey(budgetId, accountId);
      const original = this.originalValues.get(key);
      const writable = this.editableTargetWriteSignals.get(key);
      if (original !== undefined && writable) {
        writable.set(original);
      }
    } else {
      const keys = this.budgetAccountKeys.get(budgetId);
      if (!keys) return;

      for (const key of keys) {
        const original = this.originalValues.get(key);
        const writable = this.editableTargetWriteSignals.get(key);
        if (original !== undefined && writable) {
          writable.set(original);
        }
      }
    }
  }

  resetAllToOriginal(): void {
    for (const budgetId of this.budgetAccountKeys.keys()) {
      this.resetToOriginal(budgetId);
    }
  }
}
