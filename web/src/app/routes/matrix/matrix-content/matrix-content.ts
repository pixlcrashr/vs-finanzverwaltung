import { Component, computed, input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatrixHeader } from '../matrix-header/matrix-header';
import { MatrixData } from '../matrix-data-provider.service';



@Component({
  selector: 'app-matrix-content',
  imports: [CommonModule, CurrencyPipe],
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      background-color: var(--color-bg-primary);
      color: var(--color-text-primary);
    }

    .fullwidth {
      width: 100%;
    }

    .fullheight {
      height: 100%;
    }

    table {
      font-size: 10pt;
      /* font-family: "Arial", monospace; */
      background-color: var(--color-bg-primary);
      color: var(--color-text-primary);

      .vertical-divider {
        border-right: 4px solid var(--color-border);
      }
      
      tbody > tr:first-child > :is(td, th) {
        border-color: var(--color-border);
      }

      tbody > tr:nth-child(odd) > td {
        background-color: var(--color-bg-primary);
      }

      tbody > tr:nth-child(even) > td {
        background-color: var(--color-bg-secondary, rgba(127, 127, 127, 0.08));
      }

      thead {
        tr:last-child {
          border-bottom: 4px solid var(--color-border);
        }
      }

      .account-prefix-width {
        min-width: 30px;
      }

      .title-cell {
        min-width: 30px;
      }

      .empty-row {
        height: 20px;
      }

      th, td {
        padding: 2px;
      }

      td {
        vertical-align: middle;
      }

      .budget-column, .revision-column {
        padding: 0px 20px 0px 20px;
      }

      .last-revision-column, .revision-column, .budget-column {
        border-right: 1px solid var(--color-border);
      }

      .value {
        text-align: right;
        padding: 5px 5px 5px 20px;
      }

      td {
        p {
          text-align: right;
          color: var(--color-text-secondary);
        }
      }
    }
  `,
  template: `
    @let header = matrixHeader();
    @let descriptionEnabled = header.isDescriptionButtonSelected();
    @let targetEnabled = header.isTargetButtonSelected();
    @let actualEnabled = header.isActualButtonSelected();
    @let differenceEnabled = header.isDifferenceButtonSelected();
    @let accColSpan = accountColSpan();
    @let colGroupSpan = accColSpan + (descriptionEnabled ? 1 : 0);
    @let selectedBudgets = filteredColumns();
    @let rows = filteredRows();

    <div class="fullwidth fullheight overflow-auto">
      <table class="table is-narrow">
        <colgroup [span]="colGroupSpan" class="vertical-divider"></colgroup>
        <thead>
          <tr>
            <th [rowSpan]="2" [colSpan]="accColSpan">Konto</th>

            @if (descriptionEnabled) {
              <th [rowSpan]="3">Beschreibung</th>
            }

            @for (col of selectedBudgets; track col.budgetId) {
              <th [colSpan]="col.revisions.length * revisionColSpan()" class="budget-column">
                {{ col.displayName }}
              </th>
            }
          </tr>
          <tr>
            @for (col of selectedBudgets; track col.budgetId) {
              @for (rev of col.revisions; track rev.revisionId) {
                <th [colSpan]="revisionColSpan()" class="revision-column">
                  {{ rev.createdAt | date:'dd.MM.yyyy' }}
                </th>
              }
            }
          </tr>
          <tr>
            @for (i of [].constructor(accColSpan); track $index) {
              <th class="account-prefix-width"></th>
            }
            
            @for (col of selectedBudgets; track col.budgetId) {
              @for (rev of col.revisions; track rev.revisionId) {
                @if (targetEnabled) {
                  <th [class.last-revision-column]="!(actualEnabled || differenceEnabled)">Soll</th>
                }
                @if (actualEnabled) {
                  <th [class.last-revision-column]="!differenceEnabled">Ist</th>
                }
                @if (differenceEnabled) {
                  <th class="last-revision-column">Diff</th>
                }
              }
            }
          </tr>
        </thead>
        <tbody>
          @for (row of rows; track row.accountId) {
            <tr [class.font-bold]="row.isSumRow || parentAccountIds().has(row.accountId)">
              @for (i of accountCols(); track $index) {
                @if (row.depth === $index) {
                  <td [colSpan]="accColSpan - $index">{{ row.displayCode }} &mdash; {{ row.displayName }}</td>
                } @else if (row.depth > $index) {
                  <td></td>
                }
              }
              
              @if (descriptionEnabled) {
                <td>{{ row.displayDescription }}</td>
              }

              @for (budgetValues of row.values; track budgetValues.budgetId) {
                @for (revValues of budgetValues.revisions; track revValues.revisionId) {
                  @if (targetEnabled) {
                    <td [class.last-revision-column]="!(actualEnabled || differenceEnabled)" class="value">
                      {{ revValues.targetValue().toNumber() | currency:'EUR':'symbol':'1.2-2' }}
                    </td>
                  }
                  @if (actualEnabled) {
                    <td [class.last-revision-column]="!differenceEnabled" class="value">
                      {{ revValues.actualValue().toNumber() | currency:'EUR':'symbol':'1.2-2' }}
                    </td>
                  }
                  @if (differenceEnabled) {
                    <td class="last-revision-column value">
                      {{ revValues.diffValue().toNumber() | currency:'EUR':'symbol':'1.2-2' }}
                    </td>
                  }
                }
              }
            </tr>
            @if (row.isSumRow) {
              <tr class="empty-row">
                @for (i of accountCols(); track $index) {
                  <td></td>
                }
                @if (descriptionEnabled) {
                  <td></td>
                }
                @for (col of selectedBudgets; track col.budgetId) {
                  @for (rev of col.revisions; track rev.revisionId) {
                    @if (targetEnabled) {
                      <td [class.last-revision-column]="!(actualEnabled || differenceEnabled)"></td>
                    }
                    @if (actualEnabled) {
                      <td [class.last-revision-column]="!differenceEnabled"></td>
                    }
                    @if (differenceEnabled) {
                      <td class="last-revision-column"></td>
                    }
                  }
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>`,
})
export class MatrixContent {
  matrixHeader = input.required<MatrixHeader>();
  matrixData = input.required<MatrixData>();

  parentAccountIds = computed(() => {
    return new Set(
      this.matrixData().accounts
        .filter(account => account.parentAccountId !== null)
        .map(account => account.parentAccountId as string)
    );
  });

  accountColSpan = computed(() => {
    const data = this.matrixData();
    if (data.rows.length === 0) return 1;
    return Math.max(...data.rows.map(x => x.depth)) + 1;
  });
  accountCols = computed(() => Array.from({ length: this.accountColSpan() }, (_, i) => i));

  filteredColumns = computed(() => {
    const selectedIds = this.matrixHeader().selectedBudgetIds();
    const latestOnly = this.matrixHeader().isLatestRevisionOnlySelected();
    
    return this.matrixData().columns
      .filter(col => selectedIds.includes(col.budgetId))
      .map(col => ({
        ...col,
        revisions: latestOnly ? [col.revisions[col.revisions.length - 1]] : col.revisions
      }));
  });

  filteredRows = computed(() => {
    const selectedAccountIds = this.matrixHeader().selectedAccountIds();
    const selectedBudgetIds = this.matrixHeader().selectedBudgetIds();
    const latestOnly = this.matrixHeader().isLatestRevisionOnlySelected();

    return this.matrixData().rows
      .filter(row => {
        if (row.isSumRow && row.sourceAccountId) {
          return selectedAccountIds.includes(row.sourceAccountId);
        }

        return selectedAccountIds.includes(row.accountId);
      })
      .map(row => ({
        ...row,
        values: row.values
          .filter(v => selectedBudgetIds.includes(v.budgetId))
          .map(v => ({
            ...v,
            revisions: latestOnly ? [v.revisions[v.revisions.length - 1]] : v.revisions
          }))
      }));
  });

  revisionColSpan = computed(() => {
    const target = this.matrixHeader().isTargetButtonSelected();
    const actual = this.matrixHeader().isActualButtonSelected();
    const difference = this.matrixHeader().isDifferenceButtonSelected();
    
    return Math.max((target ? 1 : 0) + (actual ? 1 : 0) + (difference ? 1 : 0), 1);
  });
}
