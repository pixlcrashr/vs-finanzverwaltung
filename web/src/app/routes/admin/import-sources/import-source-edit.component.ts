import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
  StatusBadgeComponent,
} from '../../../shared/components';
import { formatDateShort } from '../../../shared/utils';
import { ImportSource, ImportSourcePeriod } from '../../../shared/models';
import { ImportSourceEditDataService } from './import-source-edit.data-service';

@Component({
  selector: 'app-import-source-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogModule,
    FormsModule,
    PageHeaderComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs">
        <div class="flex gap-2">
          <app-button variant="secondary" (clicked)="cancel()">
            Abbrechen
          </app-button>
          <app-button
            variant="primary"
            [disabled]="saving() || !isValid()"
            (clicked)="save()"
          >
            {{ saving() ? 'Wird gespeichert...' : 'Speichern' }}
          </app-button>
        </div>
      </app-page-header>

      <div class="flex flex-1 justify-center overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" text="Importquelle wird geladen..." />
        } @else if (importSource()) {
          <div class="w-full max-w-2xl space-y-3">
            <!-- Basic Info -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="text-sm font-semibold text-gray-900 mb-4">
                Grundinformationen
              </h2>
              <div class="space-y-3">
                <div>
                  <label
                    for="name"
                    class="block text-xs font-medium text-gray-500 mb-1"
                  >
                    Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    [(ngModel)]="name"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    for="description"
                    class="block text-xs font-medium text-gray-500 mb-1"
                  >
                    Beschreibung
                  </label>
                  <textarea
                    id="description"
                    [(ngModel)]="description"
                    rows="2"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  ></textarea>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-500 mb-1">
                    Erfassung seit
                  </label>
                  <p class="text-sm text-gray-900">
                    {{ formatDate(importSource()!.periodStart) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Periods -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="text-sm font-semibold text-gray-900 mb-4">
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
                        {{ period.isClosed ? 'Abgeschlossen' : 'Aktiv' }}
                      </app-status-badge>
                    </div>
                    <div class="flex items-center gap-3">
                      @if (period.isClosed && period.closedAt) {
                        <span class="text-xs text-gray-500">
                          Abgeschlossen am {{ formatDate(period.closedAt) }}
                        </span>
                      }
                      @if (!period.isClosed) {
                        <app-button
                          variant="secondary"
                          [disabled]="closingPeriod() === period.id"
                          (clicked)="openClosePeriodDialog(period)"
                        >
                          {{ closingPeriod() === period.id ? 'Wird abgeschlossen...' : 'Abschließen' }}
                        </app-button>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    <ng-template #closePeriodDialogTemplate>
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-2">
          Zeitraum abschließen
        </h2>
        <p class="text-xs text-gray-500 mb-4">
          Möchten Sie den Zeitraum {{ periodToClose()?.year }} wirklich abschließen?
          Diese Aktion kann nicht rückgängig gemacht werden.
        </p>

        <div class="flex justify-end gap-2">
          <app-button variant="secondary" (clicked)="closeDialog()">Abbrechen</app-button>
          <app-button
            variant="danger"
            [loading]="closingPeriod() === periodToClose()?.id"
            (clicked)="confirmClosePeriod()"
          >
            Abschließen
          </app-button>
        </div>
      </div>
    </ng-template>
  `,
})
export class ImportSourceEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dataService = inject(ImportSourceEditDataService);
  private readonly dialog = inject(Dialog);

  readonly closePeriodDialogTemplate = viewChild.required<TemplateRef<unknown>>(
    'closePeriodDialogTemplate',
  );

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly closingPeriod = signal<string | null>(null);
  readonly importSource = signal<ImportSource | null>(null);
  readonly periodToClose = signal<ImportSourcePeriod | null>(null);

  name = '';
  description = '';

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Importquellen', path: '/admin/import-sources' },
    { label: 'Bearbeiten' },
  ];

  private sourceId = '';
  private dialogRef: ReturnType<typeof this.dialog.open> | null = null;

  ngOnInit(): void {
    this.sourceId = this.route.snapshot.paramMap.get('id') || '';
    if (this.sourceId) {
      this.loadImportSource();
    }
  }

  private loadImportSource(): void {
    this.dataService.getImportSource(this.sourceId).subscribe({
      next: (source) => {
        this.importSource.set(source);
        this.name = source.name;
        this.description = source.description;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  isValid(): boolean {
    return this.name.trim().length > 0;
  }

  save(): void {
    if (!this.isValid()) return;

    this.saving.set(true);
    this.dataService.updateImportSource(this.sourceId, {
      name: this.name.trim(),
      description: this.description.trim(),
    }).subscribe({
      next: (updated) => {
        this.importSource.set(updated);
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  openClosePeriodDialog(period: ImportSourcePeriod): void {
    this.periodToClose.set(period);
    this.dialogRef = this.dialog.open(this.closePeriodDialogTemplate(), {
      panelClass: ['flex', 'items-center', 'justify-center'],
      backdropClass: 'bg-black/50',
    });
  }

  closeDialog(): void {
    this.dialogRef?.close();
    this.dialogRef = null;
    this.periodToClose.set(null);
  }

  confirmClosePeriod(): void {
    const period = this.periodToClose();
    if (!period) return;

    this.closingPeriod.set(period.id);
    this.dataService.closePeriod(this.sourceId, period.id).subscribe({
      next: () => {
        this.importSource.update((source) => {
          if (!source) return source;
          return {
            ...source,
            periods: source.periods.map((p) =>
              p.id === period.id ? { ...p, isClosed: true, closedAt: new Date() } : p
            ),
          };
        });
        this.closingPeriod.set(null);
        this.closeDialog();
      },
      error: () => {
        this.closingPeriod.set(null);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/import-sources']);
  }

  formatDate(date: Date): string {
    return formatDateShort(date);
  }
}
