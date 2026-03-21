import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  StatusBadgeComponent,
  LoadingSpinnerComponent,
  EmptyStateComponent,
} from '../../../shared/components';
import { Budget } from '../../../shared/models';
import { formatDateShort } from '../../../shared/utils';
import { BudgetListDataService } from './budget-list.data-service';

@Component({
  selector: 'app-budget-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DialogModule,
    PageHeaderComponent,
    ButtonComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs">
        <app-button (clicked)="openCreateDialog()">Hinzufügen</app-button>
      </app-page-header>

      <div class="flex flex-1 justify-center overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" text="Haushaltspläne werden geladen..." />
        } @else if (budgets().length === 0) {
          <app-empty-state
            title="Keine Haushaltspläne vorhanden"
            description="Erstellen Sie Ihren ersten Haushaltsplan, um mit der Budgetplanung zu beginnen."
          >
            <app-button (clicked)="openCreateDialog()">Haushaltsplan erstellen</app-button>
          </app-empty-state>
        } @else {
          <div class="w-full max-w-6xl">
            <div class="bg-white rounded-lg border border-gray-200">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                    >
                      Beginn
                    </th>
                    <th
                      scope="col"
                      class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                    >
                      Ende
                    </th>
                    <th
                      scope="col"
                      class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                    >
                      Status
                    </th>
                    <th scope="col" class="px-3 py-2 text-right">
                      <span class="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                  @for (budget of budgets(); track trackById(budget)) {
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-3 py-2 text-xs text-gray-900">{{ budget.displayName }}</td>
                      <td class="px-3 py-2 text-xs text-gray-900">{{ budget.periodStart }}</td>
                      <td class="px-3 py-2 text-xs text-gray-900">{{ budget.periodEnd }}</td>
                      <td class="px-3 py-2 text-xs text-gray-900">
                        <app-status-badge [variant]="budget.isClosed ? 'neutral' : 'success'" size="sm">
                          {{ budget.isClosed ? 'Geschlossen' : 'Offen' }}
                        </app-status-badge>
                      </td>
                      <td class="px-3 py-2 text-right text-xs">
                        <div class="flex items-center justify-end gap-2">
                          <a
                            [routerLink]="['/budgets', budget.id]"
                            class="text-xs text-blue-600 hover:underline"
                          >
                            Bearbeiten
                          </a>
                          <button
                            (click)="confirmDelete(budget)"
                            class="text-xs text-red-600 hover:underline"
                          >
                            Entfernen
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Create Dialog Template -->
    <ng-template #createDialogTemplate>
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-3">
          Haushaltsplan erstellen
        </h2>

        <form [formGroup]="createForm" (ngSubmit)="createBudget()">
          <div class="space-y-3">
            <div>
              <label
                for="name"
                class="block text-xs font-medium text-gray-700 mb-1"
              >
                Name
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
                Beschreibung
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
                  Beginn
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
                  Ende
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
            <app-button variant="secondary" (clicked)="closeDialog()">Abbrechen</app-button>
            <app-button
              type="submit"
              [disabled]="createForm.invalid"
              [loading]="creating()"
            >
              Erstellen
            </app-button>
          </div>
        </form>
      </div>
    </ng-template>

    <!-- Delete Confirmation Dialog Template -->
    <ng-template #deleteDialogTemplate>
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-2">
          Haushaltsplan entfernen
        </h2>
        <p class="text-xs text-gray-500 mb-4">
          Sind Sie sicher, dass Sie den Haushaltsplan "{{ budgetToDelete()?.displayName }}"
          entfernen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
        </p>

        <div class="flex justify-end gap-2">
          <app-button variant="secondary" (clicked)="closeDialog()">Abbrechen</app-button>
          <app-button variant="danger" [loading]="deleting()" (clicked)="deleteBudget()">
            Entfernen
          </app-button>
        </div>
      </div>
    </ng-template>
  `,
})
export class BudgetListComponent implements OnInit {
  private readonly dataService = inject(BudgetListDataService);
  private readonly dialog = inject(Dialog);
  private readonly fb = inject(FormBuilder);

  readonly createDialogTemplate = viewChild.required<TemplateRef<unknown>>('createDialogTemplate');
  readonly deleteDialogTemplate = viewChild.required<TemplateRef<unknown>>('deleteDialogTemplate');

  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly deleting = signal(false);
  readonly budgets = signal<Budget[]>([]);
  readonly budgetToDelete = signal<Budget | null>(null);

  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Haushaltspläne' }];

  readonly createForm: FormGroup;

  private dialogRef: ReturnType<typeof this.dialog.open> | null = null;

  constructor() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    this.createForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      startDate: [this.formatDateForInput(startOfYear), Validators.required],
      endDate: [this.formatDateForInput(endOfYear), Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadBudgets();
  }

  private loadBudgets(): void {
    this.dataService.getBudgets().subscribe({
      next: (budgets) => {
        // Format dates for display
        const formatted = budgets.map((b) => ({
          ...b,
          periodStart: formatDateShort(b.periodStart) as unknown as Date,
          periodEnd: formatDateShort(b.periodEnd) as unknown as Date,
        }));
        this.budgets.set(formatted as Budget[]);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  trackById = (budget: Budget) => budget.id;

  openCreateDialog(): void {
    this.createForm.reset({
      name: '',
      description: '',
      startDate: this.formatDateForInput(new Date(new Date().getFullYear(), 0, 1)),
      endDate: this.formatDateForInput(new Date(new Date().getFullYear(), 11, 31)),
    });

    this.dialogRef = this.dialog.open(this.createDialogTemplate(), {
      panelClass: ['flex', 'items-center', 'justify-center'],
      backdropClass: 'bg-black/50',
    });
  }

  confirmDelete(budget: Budget): void {
    this.budgetToDelete.set(budget);
    this.dialogRef = this.dialog.open(this.deleteDialogTemplate(), {
      panelClass: ['flex', 'items-center', 'justify-center'],
      backdropClass: 'bg-black/50',
    });
  }

  closeDialog(): void {
    this.dialogRef?.close();
    this.dialogRef = null;
    this.budgetToDelete.set(null);
  }

  createBudget(): void {
    if (this.createForm.invalid) return;

    this.creating.set(true);
    const { name, description, startDate, endDate } = this.createForm.value;

    this.dataService
      .createBudget(name, description || '', new Date(startDate), new Date(endDate))
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.closeDialog();
          this.loadBudgets();
        },
        error: () => {
          this.creating.set(false);
        },
      });
  }

  deleteBudget(): void {
    const budget = this.budgetToDelete();
    if (!budget) return;

    this.deleting.set(true);

    this.dataService.deleteBudget(budget.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.closeDialog();
        this.loadBudgets();
      },
      error: () => {
        this.deleting.set(false);
      },
    });
  }

  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
