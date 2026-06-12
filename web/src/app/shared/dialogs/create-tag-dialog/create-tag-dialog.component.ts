import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { ButtonComponent } from '../../components';
import { BudgetChange } from '../../../routes/budgets/budget-edit/budget-edit.data-service';

export interface CreateTagDialogInput {
  budgetName: string;
  hasChanges: boolean;
  changes: BudgetChange[];
  defaultName: string;
}

export interface CreateTagDialogOutput {
  confirmed: boolean;
  name?: string;
  description?: string;
}

@Component({
  selector: 'app-create-tag-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, ReactiveFormsModule, CurrencyPipe],
  template: `
    <div class="bg-white rounded-lg shadow-xl p-4 max-w-2xl">
      <h2 class="text-sm font-semibold text-gray-900 mb-4">
        <ng-container i18n>Tag erstellen</ng-container>
      </h2>

      <form [formGroup]="tagForm" class="mb-4">
        <div class="space-y-3">
          <div>
            <label for="name" class="block text-xs font-medium text-gray-700 mb-1">
              <ng-container i18n>Name</ng-container>
              <span class="text-gray-500 font-normal ml-1">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              formControlName="name"
              autocomplete="off"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              [placeholder]="data.defaultName"
            />
          </div>

          <div>
            <label for="description" class="block text-xs font-medium text-gray-700 mb-1">
              <ng-container i18n>Beschreibung</ng-container>
              <span class="text-gray-500 font-normal ml-1">(optional)</span>
            </label>
            <textarea
              id="description"
              formControlName="description"
              rows="2"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
        </div>
      </form>

      @if (data.hasChanges) {
        <p class="text-xs text-gray-600 mb-3">
          <ng-container i18n>Die folgenden Änderungen werden im Tag für</ng-container>
          <span class="font-medium text-gray-900"> "{{ data.budgetName }}" </span>
          <ng-container i18n>gespeichert:</ng-container>
        </p>

        <div class="mb-4 max-h-96 overflow-y-auto">
          <table class="min-w-full divide-y divide-gray-200 border border-gray-200 rounded">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                  <ng-container i18n>Konto</ng-container>
                </th>
                <th scope="col" class="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                  <ng-container i18n>Vorheriger Wert</ng-container>
                </th>
                <th scope="col" class="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                  <ng-container i18n>Neuer Wert</ng-container>
                </th>
                <th scope="col" class="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                  <ng-container i18n>Änderung</ng-container>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @for (change of data.changes; track change.accountId) {
                <tr class="hover:bg-gray-50">
                  <td class="px-3 py-2 text-xs font-medium text-gray-900">
                    {{ change.accountFullCode }} {{ change.accountName }}
                  </td>
                  <td class="px-3 py-2 text-xs text-gray-600">
                    {{ change.previousValue.toNumber() | currency: 'EUR':'symbol':'1.2-2':'de-DE' }}
                  </td>
                  <td class="px-3 py-2 text-xs text-gray-900">
                    {{ change.newValue.toNumber() | currency: 'EUR':'symbol':'1.2-2':'de-DE' }}
                  </td>
                  <td class="px-3 py-2 text-xs text-blue-600">
                    {{ (change.diff.toNumber() >= 0 ? '+' : '') + (change.diff.toNumber() | currency: 'EUR':'symbol':'1.2-2':'de-DE') }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <div class="flex items-start gap-2">
            <svg class="w-4 h-4 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <div>
              <p class="text-xs font-medium text-yellow-800">
                <ng-container i18n>Keine Änderungen vorhanden</ng-container>
              </p>
              <p class="text-xs text-yellow-700 mt-1">
                <ng-container i18n>Es wurden keine Änderungen am Haushaltsplan seit dem letzten Tag festgestellt. Möchtest du trotzdem einen Tag erstellen?</ng-container>
              </p>
            </div>
          </div>
        </div>
      }

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
export class CreateTagDialogComponent {
  private readonly dialogRef = inject(DialogRef<CreateTagDialogOutput>);
  private readonly fb = inject(FormBuilder);
  readonly data = inject<CreateTagDialogInput>(DIALOG_DATA);

  readonly loading = signal(false);
  readonly tagForm: FormGroup;

  constructor() {
    this.tagForm = this.fb.group({
      name: [''],
      description: [''],
    });
  }

  cancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  confirm(): void {
    this.loading.set(true);
    const { name, description } = this.tagForm.value;
    this.dialogRef.close({
      confirmed: true,
      name: name || this.data.defaultName,
      description: description || '',
    });
  }
}
