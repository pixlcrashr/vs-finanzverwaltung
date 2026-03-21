import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  StatusBadgeComponent,
  LoadingSpinnerComponent,
} from '../../../shared/components';
import { formatDateShort, formatDateForInput } from '../../../shared/utils';
import { BudgetEditDataService, BudgetDetails } from './budget-edit.data-service';

@Component({
  selector: 'app-budget-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DialogModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    ButtonComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs()">
        @if (budget() && !budget()!.isClosed) {
          <app-button variant="danger" (clicked)="openCloseBudgetDialog()">Schließen</app-button>
        }
      </app-page-header>

      <div class="flex flex-1 justify-center overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" text="Haushaltsplan wird geladen..." />
        } @else if (budget()) {
          <div class="w-full max-w-3xl space-y-3">
            <!-- Budget Form -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-sm font-semibold text-gray-900">
                  Haushaltsplan Details
                </h2>
                <app-status-badge size="sm" [variant]="budget()!.isClosed ? 'neutral' : 'success'">
                  {{ budget()!.isClosed ? 'Geschlossen' : 'Offen' }}
                </app-status-badge>
              </div>

              <form [formGroup]="budgetForm" (ngSubmit)="saveBudget()">
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
                      [readonly]="budget()!.isClosed"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                      [readonly]="budget()!.isClosed"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    ></textarea>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
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
                        [readonly]="budget()!.isClosed"
                        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                        [readonly]="budget()!.isClosed"
                        class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                @if (!budget()!.isClosed) {
                  <div class="flex justify-end gap-2 mt-4">
                    <a
                      routerLink="/budgets"
                      class="px-2 py-1 text-xs font-medium text-gray-900 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Abbrechen
                    </a>
                    <app-button
                      type="submit"
                      [disabled]="budgetForm.invalid || budgetForm.pristine"
                      [loading]="saving()"
                    >
                      Speichern
                    </app-button>
                  </div>
                }
              </form>
            </div>

            <!-- Revisions -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-sm font-semibold text-gray-900">Revisionen</h2>
                @if (!budget()!.isClosed) {
                  <app-button (clicked)="addRevision()">Hinzufügen</app-button>
                }
              </div>

              @if (budget()!.revisions.length === 0) {
                <p class="text-xs text-gray-500">Keine Revisionen vorhanden.</p>
              } @else {
                <div class="space-y-2">
                  @for (revision of budget()!.revisions; track revision.id) {
                    <div
                      class="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div>
                        <p class="text-sm font-medium text-gray-900">
                          {{ formatDateShort(revision.date) }}
                        </p>
                        <p class="text-xs text-gray-500">
                          {{ revision.description || 'Keine Beschreibung' }}
                        </p>
                      </div>
                      @if (!budget()!.isClosed && budget()!.revisions.length > 1) {
                        <button
                          (click)="deleteRevision(revision.id)"
                          class="text-xs text-red-600 hover:underline"
                        >
                          Entfernen
                        </button>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>

    <ng-template #closeBudgetDialogTemplate>
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-2">
          Haushaltsplan schließen
        </h2>
        <p class="text-xs text-gray-500 mb-4">
          Sind Sie sicher, dass Sie den Haushaltsplan "{{ budget()?.displayName }}" schließen
          möchten? Diese Aktion kann nicht rückgängig gemacht werden.
        </p>

        <div class="flex justify-end gap-2">
          <app-button variant="secondary" (clicked)="closeDialog()">Abbrechen</app-button>
          <app-button variant="danger" [loading]="closingBudget()" (clicked)="confirmCloseBudget()">
            Schließen
          </app-button>
        </div>
      </div>
    </ng-template>
  `,
})
export class BudgetEditComponent implements OnInit {
  private readonly dataService = inject(BudgetEditDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);
  private readonly fb = inject(FormBuilder);

  readonly closeBudgetDialogTemplate = viewChild.required<TemplateRef<unknown>>(
    'closeBudgetDialogTemplate',
  );

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly closingBudget = signal(false);
  readonly budget = signal<BudgetDetails | null>(null);

  readonly breadcrumbs = signal<BreadcrumbItem[]>([
    { label: 'Haushaltspläne', path: '/budgets' },
    { label: 'Laden...' },
  ]);

  readonly budgetForm: FormGroup;

  private dialogRef: ReturnType<typeof this.dialog.open> | null = null;

  constructor() {
    this.budgetForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadBudget(id);
    }
  }

  private loadBudget(id: string): void {
    this.dataService.getBudget(id).subscribe({
      next: (budget) => {
        this.budget.set(budget);
        this.budgetForm.patchValue({
          name: budget.displayName,
          description: budget.displayDescription,
          startDate: formatDateForInput(budget.periodStart),
          endDate: formatDateForInput(budget.periodEnd),
        });
        this.breadcrumbs.set([
          { label: 'Haushaltspläne', path: '/budgets' },
          { label: budget.displayName },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/budgets']);
      },
    });
  }

  saveBudget(): void {
    if (this.budgetForm.invalid) return;

    this.saving.set(true);
    const budget = this.budget()!;
    const { name, description, startDate, endDate } = this.budgetForm.value;

    this.dataService
      .updateBudget(budget.id, name, description, new Date(startDate), new Date(endDate))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.budgetForm.markAsPristine();
          this.loadBudget(budget.id);
        },
        error: () => {
          this.saving.set(false);
        },
      });
  }

  addRevision(): void {
    const budget = this.budget();
    if (!budget) return;

    this.dataService.addRevision(budget.id, new Date(), '').subscribe({
      next: () => {
        this.loadBudget(budget.id);
      },
    });
  }

  deleteRevision(revisionId: string): void {
    const budget = this.budget();
    if (!budget) return;

    this.dataService.deleteRevision(revisionId).subscribe({
      next: () => {
        this.loadBudget(budget.id);
      },
    });
  }

  openCloseBudgetDialog(): void {
    const budget = this.budget();
    if (!budget || budget.isClosed) return;

    this.dialogRef = this.dialog.open(this.closeBudgetDialogTemplate(), {
      panelClass: ['flex', 'items-center', 'justify-center'],
      backdropClass: 'bg-black/50',
    });
  }

  closeDialog(): void {
    this.dialogRef?.close();
    this.dialogRef = null;
  }

  confirmCloseBudget(): void {
    const budget = this.budget();
    if (!budget || budget.isClosed) return;

    this.closingBudget.set(true);
    this.dataService.closeBudget(budget.id).subscribe({
      next: () => {
        this.closingBudget.set(false);
        this.closeDialog();
        this.loadBudget(budget.id);
      },
      error: () => {
        this.closingBudget.set(false);
      },
    });
  }

  formatDateShort = formatDateShort;
}
