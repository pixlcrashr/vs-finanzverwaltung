import { formatCurrency } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  effect,
  input,
  model,
  signal,
  OnDestroy,
} from '@angular/core';
import { Decimal } from 'decimal.js';
import { debounceTime, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-currency-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      #inputEl
      type="text"
      class="w-20 px-1.5 py-1 text-xs text-right border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
      [class.border-red-300]="isInvalid()"
      [value]="displayValue()"
      [placeholder]="placeholder()"
      (input)="onInput($event)"
      (focusin)="onFocusIn(inputEl)"
      (focusout)="onFocusOut()"
    />
  `,
})
export class CurrencyInputComponent implements OnDestroy {
  value = model.required<string>();
  placeholder = input('0,00');
  isInvalid = input(false);

  private readonly isFocused = signal(false);
  private readonly valueUpdates = new Subject<Decimal>();
  private readonly valueUpdatesSubscription: Subscription;
  protected readonly displayValue = signal('');

  constructor() {
    this.valueUpdatesSubscription = this.valueUpdates
      .pipe(debounceTime(300))
      .subscribe((next) => {
        this.value.set(next.toFixed(2));
      });

    effect(() => {
      const current = this.value();
      if (this.isFocused()) {
        return;
      }

      const parsed = parseFloat(current.replace(',', '.'));
      this.displayValue.set(
        CurrencyInputComponent.formatValue(Number.isNaN(parsed) ? 0 : parsed),
      );
    });
  }

  protected onInput(event: Event): void {
    if (!this.isFocused()) {
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
    const parsed = parseFloat(this.value().replace(',', '.'));
    this.displayValue.set(Number.isNaN(parsed) ? '' : parsed.toString());
    setTimeout(() => input.select());
  }

  protected onFocusOut(): void {
    this.isFocused.set(false);
    const parsed = parseFloat(this.displayValue().replace(',', '.'));
    if (!Number.isNaN(parsed)) {
      const rounded = new Decimal(parsed).toDecimalPlaces(2);
      this.value.set(rounded.toFixed(2));
    }

    const current = parseFloat(this.value().replace(',', '.'));
    this.displayValue.set(
      CurrencyInputComponent.formatValue(Number.isNaN(current) ? 0 : current),
    );
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
