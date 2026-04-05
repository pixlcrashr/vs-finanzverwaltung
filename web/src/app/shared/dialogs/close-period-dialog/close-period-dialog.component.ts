import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ButtonComponent } from '../../components';
import { ClosePeriodDialogDataService } from './close-period-dialog.data-service';

export interface ClosePeriodDialogInput {
  importSourceId: string;
  periodId: string;
  periodYear: number;
}

export interface ClosePeriodDialogOutput {
  closed: boolean;
}

@Component({
  selector: 'app-close-period-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <div class="bg-white rounded-lg shadow-xl p-4">
      <h2 i18n class="text-sm font-semibold text-gray-900 mb-2">
        Zeitraum abschließen
      </h2>
      <p i18n class="text-xs text-gray-500 mb-4">
        Möchten Sie den Zeitraum {{ data.periodYear }} wirklich abschließen?
        Diese Aktion kann nicht rückgängig gemacht werden.
      </p>

      <div class="flex justify-end gap-2">
        <app-button variant="secondary" (clicked)="cancel()">
          <ng-container i18n>Abbrechen</ng-container>
        </app-button>
        <app-button
          variant="danger"
          [loading]="closing()"
          (clicked)="confirm()"
        >
          <ng-container i18n>Abschließen</ng-container>
        </app-button>
      </div>
    </div>
  `,
})
export class ClosePeriodDialogComponent {
  private readonly dialogRef = inject(DialogRef<ClosePeriodDialogOutput>);
  private readonly dataService = inject(ClosePeriodDialogDataService);
  readonly data = inject<ClosePeriodDialogInput>(DIALOG_DATA);

  readonly closing = signal(false);

  cancel(): void {
    this.dialogRef.close({ closed: false });
  }

  confirm(): void {
    this.closing.set(true);

    this.dataService.closePeriod(this.data.importSourceId, this.data.periodId).subscribe({
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
