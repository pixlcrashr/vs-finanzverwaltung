import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import {
  PageContentLayoutComponent,
  BreadcrumbItem,
  ButtonComponent,
  StatusBadgeComponent,
  LoadingSpinnerComponent,
  NotificationService,
} from '../../../shared/components';
import {
  CloseBudgetDialogComponent,
  CloseBudgetDialogInput,
  CloseBudgetDialogOutput,
} from '../../../shared/dialogs/close-budget-dialog/close-budget-dialog.component';
import { formatDateShort, formatDateForInput } from '../../../shared/utils';
import { BudgetEditDataService, BudgetDetails } from './budget-edit.data-service';

@Component({
  selector: 'app-budget-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PageContentLayoutComponent,
    ButtonComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs()">
      <div layout-content class="flex flex-1 justify-center">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Haushaltsplan wird geladen..." />
        } @else if (budget()) {
          <div class="w-full max-w-4xl">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <!-- Left Column: Form (auto-saving) + Revisions -->
              <div class="lg:col-span-2 space-y-4">
                <!-- Budget Form -->
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <div class="flex items-center justify-between mb-4">
                    <h2 i18n class="text-sm font-semibold text-gray-900">
                      Details
                    </h2>
                    @if (saving()) {
                      <span class="text-xs text-gray-500 flex items-center gap-1">
                        <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <ng-container i18n>Speichern...</ng-container>
                      </span>
                    }
                  </div>

                  <form [formGroup]="budgetForm">
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
                          [readonly]="budget()!.isClosed"
                          class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                            <ng-container i18n>Beginn</ng-container>
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
                            <ng-container i18n>Ende</ng-container>
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
                  </form>
                </div>

                <!-- Revisions -->
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <div class="flex items-center justify-between mb-4">
                    <h2 i18n class="text-sm font-semibold text-gray-900">Revisionen</h2>
                    @if (!budget()!.isClosed) {
                      <app-button size="sm" (clicked)="addRevision()"><ng-container i18n>Hinzufügen</ng-container></app-button>
                    }
                  </div>

                  @if (budget()!.revisions.length === 0) {
                    <p i18n class="text-xs text-gray-500">Keine Revisionen vorhanden.</p>
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
                              {{ revision.description || noDescriptionLabel }}
                            </p>
                          </div>
                          @if (!budget()!.isClosed && budget()!.revisions.length > 1) {
                            <button
                              (click)="deleteRevision(revision.id)"
                              class="text-xs text-red-600 hover:underline"
                            >
                              <ng-container i18n>Entfernen</ng-container>
                            </button>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Right Column: Status & Actions -->
              <div class="space-y-4">
                <!-- Status Card -->
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 i18n class="text-xs font-semibold text-gray-500 uppercase mb-3">Status</h3>
                  <app-status-badge size="sm" [variant]="budget()!.isClosed ? 'neutral' : 'success'">
                    <ng-container i18n>{{ budget()!.isClosed ? 'Geschlossen' : 'Offen' }}</ng-container>
                  </app-status-badge>
                </div>

                <!-- Actions Card -->
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 i18n class="text-xs font-semibold text-gray-500 uppercase mb-3">Aktionen</h3>
                  <div class="space-y-2">
                    @if (!budget()!.isClosed) {
                      <app-button
                        variant="danger"
                        size="md"
                        [fullWidth]="true"
                        (clicked)="openCloseBudgetDialog()"
                      >
                        <ng-container i18n>Haushaltsplan schließen</ng-container>
                      </app-button>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </app-page-content-layout>
  `,
})
export class BudgetEditComponent implements OnInit, OnDestroy {
  private readonly dataService = inject(BudgetEditDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);

  private readonly destroy$ = new Subject<void>();

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly budget = signal<BudgetDetails | null>(null);

  readonly breadcrumbs = signal<BreadcrumbItem[]>([
    { label: $localize`Haushaltspläne`, path: '/budgets' },
    { label: $localize`Laden...` },
  ]);

  readonly budgetForm: FormGroup;

  private budgetId = '';

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
      this.budgetId = id;
      this.loadBudget(id);
      this.setupAutoSave();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAutoSave(): void {
    this.budgetForm.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(500),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      filter(() => this.budgetForm.valid && this.budgetForm.dirty && !this.loading() && !this.budget()?.isClosed)
    ).subscribe(() => {
      this.saveBudget();
    });
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
        }, { emitEvent: false });
        this.budgetForm.markAsPristine();
        this.breadcrumbs.set([
          { label: $localize`Haushaltspläne`, path: '/budgets' },
          { label: budget.displayName },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden des Haushaltsplans`);
        this.loading.set(false);
        this.router.navigate(['/budgets']);
      },
    });
  }

  private saveBudget(): void {
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
          // Update breadcrumbs with new name
          this.breadcrumbs.set([
            { label: $localize`Haushaltspläne`, path: '/budgets' },
            { label: name },
          ]);
        },
        error: () => {
          this.notifications.error($localize`Fehler beim Speichern des Haushaltsplans`);
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
      error: () => {
        this.notifications.error($localize`Fehler beim Hinzufügen der Revision`);
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
      error: () => {
        this.notifications.error($localize`Fehler beim Entfernen der Revision`);
      },
    });
  }

  openCloseBudgetDialog(): void {
    const budget = this.budget();
    if (!budget || budget.isClosed) return;

    const dialogRef = this.dialog.open<CloseBudgetDialogOutput, CloseBudgetDialogInput>(
      CloseBudgetDialogComponent,
      {
        backdropClass: 'cdk-overlay-dark-backdrop',
        width: '500px',
        data: {
          budgetId: budget.id,
          budgetName: budget.displayName,
        },
      }
    );

    dialogRef.closed.subscribe((result) => {
      if (result?.closed) {
        this.loadBudget(budget.id);
      }
    });
  }

  readonly noDescriptionLabel = $localize`Keine Beschreibung`;
  formatDateShort = formatDateShort;
}
