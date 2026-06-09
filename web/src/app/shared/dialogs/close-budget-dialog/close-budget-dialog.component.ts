import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ButtonComponent } from '../../components';
import { CloseBudgetDialogDataService } from './close-budget-dialog.data-service';

export interface CloseBudgetDialogInput {
  organizationId: string;
  budgetId: string;
  budgetName: string;
}

export interface CloseBudgetDialogOutput {
  closed: boolean;
}

@Component({
  selector: 'app-close-budget-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <div class="bg-white rounded-lg shadow-xl p-4">
      <h2 i18n class="text-sm font-semibold text-gray-900 mb-2">
        Haushaltsplan schließen
      </h2>
      <p i18n class="text-xs text-gray-500 mb-4">
        Bist du sicher, dass du den Haushaltsplan "{{ data.budgetName }}" schließen
        möchtest? Diese Aktion kann nicht rückgängig gemacht werden.
      </p>

      <div class="flex justify-end gap-2">
        <app-button variant="secondary" (clicked)="cancel()">
          <ng-container i18n>Abbrechen</ng-container>
        </app-button>
        <app-button variant="danger" [loading]="closing()" (clicked)="confirm()">
          <ng-container i18n>Schließen</ng-container>
        </app-button>
      </div>
    </div>
  `,
})
export class CloseBudgetDialogComponent {
  private readonly dialogRef = inject(DialogRef<CloseBudgetDialogOutput>);
  private readonly dataService = inject(CloseBudgetDialogDataService);
  readonly data = inject<CloseBudgetDialogInput>(DIALOG_DATA);

  readonly closing = signal(false);

  cancel(): void {
    this.dialogRef.close({ closed: false });
  }

  confirm(): void {
    this.closing.set(true);

    this.dataService.closeBudget(this.data.organizationId, this.data.budgetId).subscribe({
      next: () => {
        this.closing.set(false);
        this.dialogRef.close({ closed: true });
      },
      error: () => {
        this.closing.set(false);
      },
    });
  }
}
