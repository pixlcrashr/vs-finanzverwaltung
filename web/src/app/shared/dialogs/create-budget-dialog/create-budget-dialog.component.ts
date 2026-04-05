import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../../components';
import { CreateBudgetDialogDataService } from './create-budget-dialog.data-service';

export interface CreatedBudget {
  id: string;
  name: string;
  description: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface CreateBudgetDialogOutput {
  created: boolean;
  budget?: CreatedBudget;
}

@Component({
  selector: 'app-create-budget-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonComponent],
  template: `
    <div class="bg-white rounded-lg shadow-xl p-4">
      <h2 i18n class="text-sm font-semibold text-gray-900 mb-3">
        Haushaltsplan erstellen
      </h2>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="space-y-3">
          <div>
            <label
              for="name"
              class="block text-xs font-medium text-gray-700 mb-1"
            >
              <ng-container i18n>Name</ng-container>
            </label>
            <input
              id="name"
              type="text"
              formControlName="name"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              for="description"
              class="block text-xs font-medium text-gray-700 mb-1"
            >
              <ng-container i18n>Beschreibung</ng-container>
            </label>
            <textarea
              id="description"
              formControlName="description"
              rows="2"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label
                for="startDate"
                class="block text-xs font-medium text-gray-700 mb-1"
              >
                <ng-container i18n>Beginn</ng-container>
              </label>
              <input
                id="startDate"
                type="date"
                formControlName="startDate"
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                for="endDate"
                class="block text-xs font-medium text-gray-700 mb-1"
              >
                <ng-container i18n>Ende</ng-container>
              </label>
              <input
                id="endDate"
                type="date"
                formControlName="endDate"
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <app-button variant="secondary" (clicked)="cancel()">
            <ng-container i18n>Abbrechen</ng-container>
          </app-button>
          <app-button
            type="submit"
            [disabled]="form.invalid"
            [loading]="creating()"
          >
            <ng-container i18n>Erstellen</ng-container>
          </app-button>
        </div>
      </form>
    </div>
  `,
})
export class CreateBudgetDialogComponent {
  private readonly dialogRef = inject(DialogRef<CreateBudgetDialogOutput>);
  private readonly dataService = inject(CreateBudgetDialogDataService);
  private readonly fb = inject(FormBuilder);

  readonly creating = signal(false);

  readonly form: FormGroup;

  constructor() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      startDate: [this.formatDateForInput(startOfYear), Validators.required],
      endDate: [this.formatDateForInput(endOfYear), Validators.required],
    });
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  cancel(): void {
    this.dialogRef.close({ created: false });
  }

  submit(): void {
    if (this.form.invalid) return;

    this.creating.set(true);
    const { name, description, startDate, endDate } = this.form.value;

    this.dataService
      .createBudget(name, description || '', new Date(startDate), new Date(endDate))
      .subscribe({
        next: (budget) => {
          this.creating.set(false);
          this.dialogRef.close({
            created: true,
            budget,
          });
        },
        error: () => {
          this.creating.set(false);
        },
      });
  }
}
