import { formatCurrency } from '@angular/common';
import { Component, effect, input, model, signal } from '@angular/core';
import { Decimal } from 'decimal.js';
import { debounceTime, Subject, Subscription } from 'rxjs';



@Component({
  selector: 'app-matrix-value-input',
  imports: [],
  template: `<input
    #inputEl
    type="text"
    class="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full px-2 text-right text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500"
    [value]="displayValue()"
    [disabled]="disabled()"
    [tabIndex]="tabIndex()"
    (input)="onInput($event)"
    (focusin)="onFocusIn(inputEl)"
    (focusout)="onFocusOut()"
  />`,
  styles: ``,
})
export class MatrixValueInput {
  value = model.required<Decimal>();
  disabled = input(false);
  tabIndex = input(0);

  private readonly isFocused = signal(false);
  private readonly valueUpdates = new Subject<Decimal>();
  private readonly valueUpdatesSubscription: Subscription;
  protected readonly displayValue = signal('');

  constructor() {
    this.valueUpdatesSubscription = this.valueUpdates
      .pipe(debounceTime(300))
      .subscribe(next => {
        this.value.set(next);
      });

    effect(() => {
      const current = this.value();
      if (this.isFocused()) {
        return;
      }

      this.displayValue.set(MatrixValueInput.formatValue(current.toNumber()));
    });
  }

  protected onInput(event: Event): void {
    if (this.isFocused() === false) {
      return;
    }

    const raw = (event.target as HTMLInputElement).value;
    this.displayValue.set(raw);

    const parsed = parseFloat(raw.replace(',', '.'));
    if (Number.isNaN(parsed)) {
      return;
    }

    const next = new Decimal(parsed).toDecimalPlaces(2);
    this.valueUpdates.next(next);
  }

  protected onFocusIn(input: HTMLInputElement): void {
    this.isFocused.set(true);
    const n = this.value().toNumber();
    this.displayValue.set(Number.isNaN(n) ? '' : n.toString());
    input.select();
  }

  protected onFocusOut(): void {
    this.isFocused.set(false);
    const parsed = parseFloat(this.displayValue().replace(',', '.'));
    if (!Number.isNaN(parsed)) {
      this.value.set(new Decimal(parsed).toDecimalPlaces(2));
    }

    const rounded = this.value().mul(100).toNumber() / 100;
    this.displayValue.set(MatrixValueInput.formatValue(rounded));
  }

  ngOnDestroy(): void {
    this.valueUpdatesSubscription.unsubscribe();
    this.valueUpdates.complete();
  }

  private static formatValue(v: number): string {
    if (Number.isNaN(v)) {
      return '- €';
    }

    return formatCurrency(v, 'de-DE', '€', 'EUR');
  }
}
