import { Component, computed, inject, OnInit, Signal, signal } from '@angular/core';
import { MatrixHeader } from "./matrix-header/matrix-header";
import { MatrixContent } from "./matrix-content/matrix-content";
import { MatrixValueStoreService } from './matrix-value-store.service';
import { MatrixData, MatrixDataProviderService } from './matrix-data-provider.service';
import { delay } from 'rxjs';



@Component({
  selector: 'app-matrix',
  imports: [MatrixHeader, MatrixContent],
  providers: [MatrixValueStoreService, MatrixDataProviderService],
  template: `
    <div class="flex flex-col h-full w-full min-w-[700px]">
      <app-matrix-header
        #matrixHeader
        [budgets]="budgets()"
        [accounts]="accounts()"
        [isLoading]="isLoading()"
        [isSaving]="isSaving()"
        [(selectedBudgetIds)]="selectedBudgetIds"
        [(selectedAccountIds)]="selectedAccountIds"
        (saveClick)="onSave()"
      />
      <div class="flex-grow overflow-auto">
        @if (matrixData(); as data) {
          <app-matrix-content [matrixHeader]="matrixHeader" [matrixData]="data" />
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
export class Matrix implements OnInit {
  private readonly dataProvider = inject(MatrixDataProviderService);

  isLoading = signal(true);
  isSaving = signal(false);

  matrixData = signal<MatrixData>({
    columns: [],
    rows: [],
    budgets: [],
    accounts: []
  });

  budgets = computed(() => this.matrixData().budgets);
  accounts = computed(() => this.matrixData().accounts);

  selectedBudgetIds = signal<string[]>([]);
  selectedAccountIds = signal<string[]>([]);

  ngOnInit(): void {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    this.isLoading.set(true);
    
    this.dataProvider.getMatrixData().pipe(
      delay(200)
    ).subscribe({
      next: (data) => {
        if (data.budgets.length > 0 && this.selectedBudgetIds().length === 0) {
          this.selectedBudgetIds.set([data.budgets[0].id]);
        }

        if (data.accounts.length > 0 && this.selectedAccountIds().length === 0) {
          const nonArchivedIds = data.accounts
            .filter(a => !a.isArchived)
            .map(a => a.id);
          this.selectedAccountIds.set(nonArchivedIds);
        }

        this.matrixData.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onSave(): void {
    this.isSaving.set(true);
    console.log('Save matrix data');
    
    // Simulate API call
    setTimeout(() => {
      this.isSaving.set(false);
    }, 1500);
  }
}
