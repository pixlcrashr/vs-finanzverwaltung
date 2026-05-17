import { Component, inject, signal } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ButtonComponent } from '../../components';

export interface DeleteAccountGroupDialogInput {
  groupId: string;
  groupName: string;
  onDelete: (groupId: string) => Promise<void>;
}

export interface DeleteAccountGroupDialogOutput {
  deleted: boolean;
}

@Component({
  selector: 'app-delete-account-group-dialog',
  imports: [ButtonComponent],
  template: `
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4" i18n>
        Kontengruppe löschen
      </h2>

      <p class="text-sm text-gray-700 mb-6">
        <ng-container i18n>
          Möchten Sie die Kontengruppe <strong>{{ data.groupName }}</strong> wirklich löschen?
          Diese Aktion kann nicht rückgängig gemacht werden.
        </ng-container>
      </p>

      <div class="flex gap-3 justify-end">
        <app-button
          variant="secondary"
          size="sm"
          (clicked)="onCancel()"
          [disabled]="deleting()"
        >
          <ng-container i18n>Abbrechen</ng-container>
        </app-button>

        <app-button
          variant="danger"
          size="sm"
          (clicked)="onConfirmDelete()"
          [disabled]="deleting()"
        >
          @if (deleting()) {
            <svg class="animate-spin h-4 w-4 mr-2 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <ng-container i18n>Wird gelöscht...</ng-container>
          } @else {
            <ng-container i18n>Löschen</ng-container>
          }
        </app-button>
      </div>
    </div>
  `,
})
export class DeleteAccountGroupDialogComponent {
  private readonly dialogRef = inject(DialogRef<DeleteAccountGroupDialogOutput>);
  readonly data = inject<DeleteAccountGroupDialogInput>(DIALOG_DATA);

  readonly deleting = signal(false);

  onCancel(): void {
    this.dialogRef.close({ deleted: false });
  }

  async onConfirmDelete(): Promise<void> {
    this.deleting.set(true);

    try {
      await this.data.onDelete(this.data.groupId);
      this.dialogRef.close({ deleted: true });
    } catch (error) {
      this.deleting.set(false);
      // Error handling is done by the caller
    }
  }
}
