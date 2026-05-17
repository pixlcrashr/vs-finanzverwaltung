import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ButtonComponent } from '../../components';

export interface ForceTagDialogInput {
  budgetName: string;
}

export interface ForceTagDialogOutput {
  confirmed: boolean;
}

@Component({
  selector: 'app-force-tag-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <div class="bg-white rounded-lg shadow-xl p-4">
      <h2 class="text-sm font-semibold text-gray-900 mb-2">
        <ng-container i18n>Tag ohne Änderungen erstellen</ng-container>
      </h2>
      <p class="text-xs text-gray-600 mb-4">
        <ng-container i18n>Es wurden keine Änderungen am Haushaltsplan</ng-container>
        <span class="font-medium text-gray-900">"{{ data.budgetName }}"</span>
        <ng-container i18n>seit dem letzten Tag festgestellt. Möchtest du trotzdem einen Tag erstellen?</ng-container>
      </p>

      <div class="flex justify-end gap-2">
        <app-button variant="secondary" (clicked)="cancel()">
          <ng-container i18n>Abbrechen</ng-container>
        </app-button>
        <app-button
          variant="primary"
          [loading]="loading()"
          (clicked)="confirm()"
        >
          <ng-container i18n>Tag erstellen</ng-container>
        </app-button>
      </div>
    </div>
  `,
})
export class ForceTagDialogComponent {
  private readonly dialogRef = inject(DialogRef<ForceTagDialogOutput>);
  readonly data = inject<ForceTagDialogInput>(DIALOG_DATA);

  readonly loading = signal(false);

  cancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  confirm(): void {
    this.loading.set(true);
    this.dialogRef.close({ confirmed: true });
  }
}
