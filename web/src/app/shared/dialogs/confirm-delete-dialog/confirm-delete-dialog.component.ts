import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ButtonComponent } from '../../components';

export interface ConfirmDeleteDialogInput {
  title: string;
  message: string;
  itemName: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface ConfirmDeleteDialogOutput {
  confirmed: boolean;
}

@Component({
  selector: 'app-confirm-delete-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <div class="bg-white rounded-lg shadow-xl p-4">
      <h2 class="text-sm font-semibold text-gray-900 mb-2">
        {{ data.title }}
      </h2>
      <p class="text-xs text-gray-600 mb-4">
        {{ data.message }}
        <span class="font-medium text-gray-900">"{{ data.itemName }}"</span>
      </p>

      <div class="flex justify-end gap-2">
        <app-button variant="secondary" (clicked)="cancel()">
          {{ data.cancelLabel || cancelLabel }}
        </app-button>
        <app-button
          variant="danger"
          [loading]="loading()"
          (clicked)="confirm()"
        >
          {{ data.confirmLabel || confirmLabel }}
        </app-button>
      </div>
    </div>
  `,
})
export class ConfirmDeleteDialogComponent {
  private readonly dialogRef = inject(DialogRef<ConfirmDeleteDialogOutput>);
  readonly data = inject<ConfirmDeleteDialogInput>(DIALOG_DATA);

  readonly loading = signal(false);

  readonly cancelLabel = $localize`Abbrechen`;
  readonly confirmLabel = $localize`Löschen`;

  cancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  confirm(): void {
    this.loading.set(true);
    this.dialogRef.close({ confirmed: true });
  }
}
