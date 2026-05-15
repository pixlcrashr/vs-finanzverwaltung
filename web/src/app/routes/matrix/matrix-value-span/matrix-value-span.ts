import { Component, Input, input } from '@angular/core';
import { Decimal } from 'decimal.js';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-matrix-value-span',
  imports: [CurrencyPipe],
  template: `<span>{{ value.toNumber() | currency:'EUR':'symbol':'1.2-2' }}</span>`,
  styles: ``,
})
export class MatrixValueSpan {
  @Input()
  value: Decimal = new Decimal(0);
}
