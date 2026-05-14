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
  LoadingSpinnerComponent,
  StatusBadgeComponent,
  NotificationService,
} from '../../../shared/components';
import {
  ClosePeriodDialogComponent,
  ClosePeriodDialogInput,
  ClosePeriodDialogOutput,
} from '../../../shared/dialogs/close-period-dialog/close-period-dialog.component';
import { formatDateShort } from '../../../shared/utils';
import { ImportSource, ImportSourcePeriod } from '../../../shared/models';
import { ImportSourceEditDataService } from './import-source-edit.data-service';

@Component({
  selector: 'app-import-source-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PageContentLayoutComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
  ],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs()">
      <div layout-content class="flex flex-1 justify-center">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Importquelle wird geladen..." />
        } @else if (importSource()) {
          <div class="w-full max-w-4xl">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <!-- Left Column: Form (auto-saving) + Periods -->
              <div class="lg:col-span-2 space-y-4">
                <!-- Basic Info -->
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <div class="flex items-center justify-between mb-4">
                    <h2 i18n class="text-sm font-semibold text-gray-900">
                      Grundinformationen
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

                  <form [formGroup]="sourceForm">
                    <div class="space-y-3">
                      <div>
                        <label
                          for="name"
                          class="block text-xs font-medium text-gray-700 mb-1"
                        >
                          <ng-container i18n>Name *</ng-container>
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
                          class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </form>
                </div>

                <!-- Periods -->
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <h2 i18n class="text-sm font-semibold text-gray-900 mb-4">
                    Importzeiträume
                  </h2>
                  <div class="space-y-2">
                    @for (period of importSource()!.periods; track period.id) {
                      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center gap-3">
                          <span class="text-sm font-medium text-gray-900">
                            {{ period.year }}
                          </span>
                          <app-status-badge [variant]="period.isClosed ? 'neutral' : 'success'" size="sm">
                            <ng-container i18n>{{ period.isClosed ? 'Abgeschlossen' : 'Aktiv' }}</ng-container>
                          </app-status-badge>
                        </div>
                        <div class="flex items-center gap-3">
                          @if (period.isClosed && period.closedAt) {
                            <span i18n class="text-xs text-gray-500">
                              Abgeschlossen am {{ formatDate(period.closedAt) }}
                            </span>
                          }
                          @if (!period.isClosed) {
                            <app-button
                              variant="secondary"
                              size="sm"
                              [disabled]="closingPeriod() === period.id"
                              (clicked)="openClosePeriodDialog(period)"
                            >
                              <ng-container i18n>{{ closingPeriod() === period.id ? 'Wird abgeschlossen...' : 'Abschließen' }}</ng-container>
                            </app-button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Right Column: Info & Actions -->
              <div class="space-y-4">
                <!-- Info Card -->
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 i18n class="text-xs font-semibold text-gray-500 uppercase mb-3">Informationen</h3>
                  <dl class="space-y-3">
                    <div>
                      <dt i18n class="text-xs text-gray-500">Erfassung seit</dt>
                      <dd class="text-sm text-gray-900">
                        {{ formatDate(importSource()!.periodStart) }}
                      </dd>
                    </div>
                    <div>
                      <dt i18n class="text-xs text-gray-500">Zeiträume gesamt</dt>
                      <dd class="text-sm text-gray-900">{{ importSource()!.periods.length }}</dd>
                    </div>
                    <div>
                      <dt i18n class="text-xs text-gray-500">Aktive Zeiträume</dt>
                      <dd class="text-sm text-gray-900">{{ getActivePeriodsCount() }}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </app-page-content-layout>
  `,
})
export class ImportSourceEditComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly dataService = inject(ImportSourceEditDataService);
  private readonly dialog = inject(Dialog);
  private readonly notifications = inject(NotificationService);

  private readonly destroy$ = new Subject<void>();

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly closingPeriod = signal<string | null>(null);
  readonly importSource = signal<ImportSource | null>(null);

  readonly breadcrumbs = signal<BreadcrumbItem[]>([
    { label: $localize`Importquellen`, path: '/admin/importSources' },
    { label: $localize`Laden...` },
  ]);

  readonly sourceForm: FormGroup;

  private sourceId = '';

  constructor() {
    this.sourceForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.sourceId = this.route.snapshot.paramMap.get('id') || '';
    if (this.sourceId) {
      this.loadImportSource();
      this.setupAutoSave();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAutoSave(): void {
    this.sourceForm.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(500),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      filter(() => this.sourceForm.valid && this.sourceForm.dirty && !this.loading())
    ).subscribe(() => {
      this.saveImportSource();
    });
  }

  private loadImportSource(): void {
    this.dataService.getImportSource(this.sourceId).subscribe({
      next: (source) => {
        this.importSource.set(source);
        this.sourceForm.patchValue({
          name: source.name,
          description: source.description,
        }, { emitEvent: false });
        this.sourceForm.markAsPristine();
        this.breadcrumbs.set([
          { label: $localize`Importquellen`, path: '/admin/importSources' },
          { label: source.name },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden der Importquelle`);
        this.loading.set(false);
        this.router.navigate(['/admin/importSources']);
      },
    });
  }

  private saveImportSource(): void {
    if (this.sourceForm.invalid) return;

    this.saving.set(true);
    const { name, description } = this.sourceForm.value;

    this.dataService.updateImportSource(this.sourceId, {
      name: name.trim(),
      description: description.trim(),
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.sourceForm.markAsPristine();
        // Update breadcrumbs with new name
        this.breadcrumbs.set([
          { label: $localize`Importquellen`, path: '/admin/importSources' },
          { label: name.trim() },
        ]);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Speichern der Importquelle`);
        this.saving.set(false);
      },
    });
  }

  openClosePeriodDialog(period: ImportSourcePeriod): void {
    const dialogRef = this.dialog.open<ClosePeriodDialogOutput, ClosePeriodDialogInput>(
      ClosePeriodDialogComponent,
      {
        backdropClass: 'cdk-overlay-dark-backdrop',
        width: '500px',
        data: {
          importSourceId: this.sourceId,
          periodId: period.id,
          periodYear: period.year,
        },
      }
    );

    dialogRef.closed.subscribe((result) => {
      if (result?.closed) {
        this.loadImportSource();
      }
    });
  }

  formatDate(date: Date): string {
    return formatDateShort(date);
  }

  getActivePeriodsCount(): number {
    const source = this.importSource();
    if (!source) return 0;
    return source.periods.filter(p => !p.isClosed).length;
  }
}
