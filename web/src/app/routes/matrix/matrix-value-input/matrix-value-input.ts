import { formatCurrency } from '@angular/common';
import { Component, effect, input, model, output, signal } from '@angular/core';
import { Decimal } from 'decimal.js';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';



@Component({
  selector: 'app-matrix-value-input',
  imports: [FontAwesomeModule],
  template: `
    <div class="flex items-center gap-1">
      <input
        #inputEl
        type="text"
        class="appearance-none border-2 rounded w-full px-2 text-right text-gray-700 leading-tight focus:outline-none"
        [class.bg-yellow-100]="hasChanged()"
        [class.border-yellow-100]="hasChanged()"
        [class.focus:border-purple-500]="true"
        [class.focus:bg-yellow-50]="hasChanged()"
        [class.bg-gray-200]="!hasChanged()"
        [class.border-gray-200]="!hasChanged()"
        [class.focus:bg-white]="!hasChanged()"
        [value]="displayValue()"
        [disabled]="disabled()"
        [tabIndex]="tabIndex()"
        (input)="onInput($event)"
        (focusin)="onFocusIn(inputEl)"
        (focusout)="onFocusOut()"
      />
      <button
        type="button"
        class="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-xs transition-colors"
        [class.text-red-500]="hasChanged()"
        [class.hover:text-red-700]="hasChanged()"
        [class.cursor-pointer]="hasChanged()"
        [class.text-gray-300]="!hasChanged()"
        [class.cursor-not-allowed]="!hasChanged()"
        [disabled]="!hasChanged()"
        (click)="onResetClick()"
        title="Reset"
        i18n-title
      >
        <fa-icon [icon]="faXmark"></fa-icon>
      </button>
    </div>
  `,
  styles: ``,
})
export class MatrixValueInput {
  protected readonly faXmark = faXmark;

  value = model.required<Decimal>();
  disabled = input(false);
  tabIndex = input(0);
  hasChanged = input(false);
  resetClick = output<void>();

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

  protected onResetClick(): void {
    if (this.hasChanged()) {
      this.resetClick.emit();
    }
  }

  private static formatValue(v: number): string {
    if (Number.isNaN(v)) {
      return '- €';
    }

    return formatCurrency(v, 'de-DE', '€', 'EUR');
  }
}
