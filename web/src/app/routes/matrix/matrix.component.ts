import { Component, computed, inject, signal, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { merge, map, distinctUntilChanged, filter, delay } from 'rxjs';
import { MatrixHeader, ExportButtonClickArgs } from "./matrix-header/matrix-header";
import { MatrixContent } from "./matrix-content/matrix-content";
import { MatrixValueStoreService } from './matrix-value-store.service';
import { MatrixData, MatrixDataProviderService } from './matrix-data-provider.service';
import { MatrixDataService, MatrixBudgetValueUpdate } from './matrix.data-service';
import { LoadingSpinnerComponent } from '../../shared/components';
import { HasPermissionPipe } from '../../../lib/authz/has-permission.pipe';
import { Permission, Permissions } from '../../../lib/authz/permissions';
import {
  ExportMatrixDialogComponent,
  ExportMatrixDialogInput,
  ExportMatrixDialogOutput,
} from '../../shared/dialogs/export-matrix-dialog/export-matrix-dialog.component';



@Component({
  selector: 'app-matrix',
  imports: [MatrixHeader, MatrixContent, LoadingSpinnerComponent, HasPermissionPipe],
  providers: [MatrixValueStoreService, MatrixDataProviderService],
  template: `
    <div class="flex flex-col h-full w-full min-w-[700px]">
      <app-matrix-header
        #matrixHeader
        [budgets]="budgets()"
        [accounts]="accounts()"
        [isLoading]="isLoading()"
        [isSaving]="isSaving()"
        [hasPendingChanges]="hasPendingChanges()"
        [canSave]="Permissions.MATRIX_UPDATE | hasPermission"
        [(selectedBudgetIds)]="selectedBudgetIds"
        [(selectedTagIds)]="selectedTagIds"
        [(selectedAccountIds)]="selectedAccountIds"
        (saveClick)="onSave()"
        (exportButtonClick)="onExport($event)"
      />
      <div class="flex-grow overflow-auto">
        @if (isLoading() && !hasLoadedData()) {
          <app-loading-spinner i18n-text text="Matrix wird geladen..." [fullPage]="true" />
        } @else {
          @let data = matrixData();
          <app-matrix-content [matrixHeader]="matrixHeader" [matrixData]="data" [isSaving]="isSaving()" />
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }
  `,
})
export class Matrix {
  private readonly route = inject(ActivatedRoute);
  private readonly dataProvider = inject(MatrixDataProviderService);
  private readonly dataService = inject(MatrixDataService);
  private readonly dialog = inject(Dialog);
  protected readonly valueStore = inject(MatrixValueStoreService);

  private orgId = '';

  isLoading = signal(true);
  isSaving = signal(false);
  hasLoadedData = signal(false);
  readonly Permissions = Permissions;

  matrixData = signal<MatrixData>({
    columns: [],
    rows: [],
    budgets: [],
    accounts: []
  });

  budgets = computed(() => this.matrixData().budgets);
  accounts = computed(() => this.matrixData().accounts);

  hasPendingChanges = computed(() =>
    this.matrixData().rows.some(row =>
      row.values.some(v => this.valueStore.hasChanged(v.budgetId, row.accountId))
    )
  );

  selectedBudgetIds = signal<string[]>([]);
  selectedTagIds = signal<string[]>([]);
  selectedAccountIds = signal<string[]>([]);

  private readonly configKey = computed(() => `vsfv:matrix-config:${this.orgId}`);

  private saveConfigToStorage(): void {
    const key = this.configKey();
    if (!key) return;
    const config = {
      selectedBudgetIds: this.selectedBudgetIds(),
      selectedTagIds: this.selectedTagIds(),
      selectedAccountIds: this.selectedAccountIds(),
    };
    try {
      localStorage.setItem(key, JSON.stringify(config));
    } catch {}
  }

  private loadConfigFromStorage(): { selectedBudgetIds: string[]; selectedTagIds: string[]; selectedAccountIds: string[] } | null {
    const key = this.configKey();
    if (!key) return null;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  constructor() {
    effect(() => {
      this.selectedBudgetIds();
      this.selectedTagIds();
      this.selectedAccountIds();
      this.saveConfigToStorage();
    });

    merge(...this.route.pathFromRoot.map(r => r.params)).pipe(
      map(params => params['orgId'] as string | undefined),
      filter((id): id is string => !!id),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe((id) => {
      this.orgId = id;
      this.isLoading.set(true);
      this.hasLoadedData.set(false);
      this.matrixData.set({ columns: [], rows: [], budgets: [], accounts: [] });
      const saved = this.loadConfigFromStorage();
      this.selectedBudgetIds.set(saved?.selectedBudgetIds ?? []);
      this.selectedTagIds.set(saved?.selectedTagIds ?? []);
      this.selectedAccountIds.set(saved?.selectedAccountIds ?? []);
      this.valueStore.resetAllToOriginal();
      this.loadInitialData();
    });
  }

  private loadInitialData(): void {
    this.isLoading.set(true);

    this.dataProvider.getMatrixData(this.orgId).pipe(
      delay(200)
    ).subscribe({
      next: (data) => {
        const saved = this.loadConfigFromStorage();
        if (saved && saved.selectedBudgetIds.length > 0) {
          const validBudgetIds = saved.selectedBudgetIds.filter(id =>
            data.budgets.some(b => b.id === id)
          );
          if (validBudgetIds.length > 0) {
            this.selectedBudgetIds.set(validBudgetIds);
          } else if (data.budgets.length > 0) {
            const firstBudget = data.budgets[0];
            this.selectedBudgetIds.set([firstBudget.id]);
            const lastTag = firstBudget.tags[firstBudget.tags.length - 1];
            this.selectedTagIds.set(lastTag ? [lastTag.id] : []);
          }
        } else if (data.budgets.length > 0 && this.selectedBudgetIds().length === 0) {
          const firstBudget = data.budgets[0];
          this.selectedBudgetIds.set([firstBudget.id]);
          const lastTag = firstBudget.tags[firstBudget.tags.length - 1];
          this.selectedTagIds.set(lastTag ? [lastTag.id] : []);
        }

        if (saved && saved.selectedTagIds.length > 0) {
          const validTagIds = saved.selectedTagIds.filter(id =>
            data.budgets.some(b => b.tags.some(t => t.id === id))
          );
          if (validTagIds.length > 0) {
            this.selectedTagIds.set(validTagIds);
          }
        }

        if (saved && saved.selectedAccountIds.length > 0) {
          const validAccountIds = saved.selectedAccountIds.filter(id =>
            data.accounts.some(a => a.id === id)
          );
          if (validAccountIds.length > 0) {
            this.selectedAccountIds.set(validAccountIds);
          }
        } else if (data.accounts.length > 0 && this.selectedAccountIds().length === 0) {
          const nonArchivedIds = data.accounts
            .filter(a => !a.isArchived)
            .map(a => a.id);
          this.selectedAccountIds.set(nonArchivedIds);
        }

        this.matrixData.set(data);
        this.hasLoadedData.set(true);
        this.isLoading.set(false);
        this.saveConfigToStorage();
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSave(): void {
    const allChangedValues = this.valueStore.getAllChangedValues();

    if (allChangedValues.size === 0) {
      return;
    }

    const updates: MatrixBudgetValueUpdate[] = [];
    allChangedValues.forEach((changedValues, budgetId) => {
      changedValues.forEach(cv => {
        updates.push({
          budgetId,
          accountId: cv.accountId,
          value: cv.value
        });
      });
    });

    this.isSaving.set(true);

    this.dataService.updateMatrixBudgetValues(this.orgId, updates).subscribe({
      next: () => {
        this.valueStore.markAllAsClean();
        this.matrixData.update(d => ({ ...d }));
        this.isSaving.set(false);
      },
      error: () => {
        this.isSaving.set(false);
      }
    });
  }

  onExport(_args: ExportButtonClickArgs): void {
    const dialogRef = this.dialog.open<ExportMatrixDialogOutput, ExportMatrixDialogInput>(
      ExportMatrixDialogComponent,
      {
        backdropClass: 'cdk-overlay-dark-backdrop',
        width: '500px',
        data: {
          organizationId: this.orgId,
          templates: [],
        },
      }
    );

    dialogRef.closed.subscribe((result) => {
      if (result?.confirmed) {
        // TODO: Implement actual export logic once backend supports it
      }
    });
  }
}
