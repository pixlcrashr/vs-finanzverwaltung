import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  computed,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';
import { Account } from '../../../shared/models';
import { formatCurrency } from '../../../shared/utils';
import { NotificationService } from '../../../shared/components';
import {
  JournalAssignmentEditorDataService,
} from './journal-assignment-editor.data-service';
import { JournalAccountAssignment } from './journal-list.data-service';

interface EditableAssignment {
  id: string;
  accountId: string;
  value: string;
}

@Component({
  selector: 'app-journal-assignment-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="space-y-1">
      @if (editableAssignments().length > 0) {
        <div class="overflow-x-auto">
          <table class="w-full text-[11px]">
            <thead>
              <tr class="text-gray-500">
                <th i18n class="text-left py-0.5 px-1 font-medium w-1/2">Konto</th>
                <th i18n class="text-right py-0.5 px-1 font-medium w-24">Betrag</th>
                <th class="w-6 py-0.5 px-1"></th>
              </tr>
            </thead>
            <tbody>
              @for (assignment of editableAssignments(); track $index; let i = $index) {
                <tr class="border-t border-gray-100">
                  <td class="py-0.5 px-1">
                    <select
                      [ngModel]="assignment.accountId"
                      (ngModelChange)="onAccountChange($event, i)"
                      [disabled]="!editable()"
                      class="w-full px-1 py-0.5 text-[11px] border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      [class.border-red-300]="!assignment.accountId"
                    >
                      <option value="" i18n>Konto...</option>
                      @for (account of selectableAccounts(); track account.id) {
                        <option [value]="account.id">{{ account.code }} {{ account.name }}</option>
                      }
                    </select>
                  </td>
                  <td class="py-0.5 px-1">
                    <input
                      type="text"
                      [ngModel]="assignment.value"
                      (ngModelChange)="onValueChange($event, i)"
                      [disabled]="!editable()"
                      class="w-full px-1 py-0.5 text-[11px] text-right border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </td>
                  <td class="py-0.5 px-1 text-center">
                    @if (editable()) {
                      <button
                        type="button"
                        (click)="removeAssignment(i)"
                        [disabled]="saving()"
                        class="px-1 py-0.5 text-[11px] text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        i18n-title title="Entfernen"
                      >✕</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <p i18n class="text-[11px] text-gray-400 italic py-1">
          Keine Zuordnungen.
        </p>
      }

      @if (editable()) {
        <div class="flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            (click)="addAssignment()"
            [disabled]="saving()"
            class="px-1.5 py-0.5 text-[11px] font-medium text-green-700 border border-green-200 rounded hover:bg-green-50 disabled:opacity-30 disabled:cursor-not-allowed"
            i18n
          >+ Hinzufügen</button>

          <div class="flex items-center gap-2">
            <span
              class="text-[11px]"
              [class.text-red-500]="assignedPercentage() > 100"
              [class.text-gray-500]="assignedPercentage() <= 100"
            >
              {{ formatAmount(assignedTotal()) }} / {{ formatAmount(transactionAmount()) }}
              ({{ assignedPercentage().toFixed(0) }}%)
            </span>
            @if (hasUnsavedChanges()) {
              <button
                type="button"
                (click)="save()"
                [disabled]="saving()"
                class="px-1.5 py-0.5 text-[11px] font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ng-container i18n>{{ saving() ? '...' : 'Speichern' }}</ng-container>
              </button>
            }
          </div>
        </div>
      } @else {
        <p i18n class="text-[11px] text-gray-400 italic pt-1">
          Geschäftsjahr ist geschlossen — Zuordnungen können nicht bearbeitet werden.
        </p>
      }
    </div>
  `,
})
export class JournalAssignmentEditorComponent implements OnChanges {
  private readonly dataService = inject(JournalAssignmentEditorDataService);
  private readonly notifications = inject(NotificationService);

  readonly organizationId = input.required<string>();
  readonly transactionId = input.required<string>();
  readonly assignments = input.required<JournalAccountAssignment[]>();
  readonly transactionAmount = input.required<string>();
  readonly editable = input<boolean>(true);
  readonly availableAccounts = input<Account[]>([]);

  readonly assignmentsChanged = output<JournalAccountAssignment[]>();

  private originalAssignments = signal<ReadonlyArray<EditableAssignment>>([]);
  readonly editableAssignments = signal<EditableAssignment[]>([]);
  readonly saving = signal(false);

  readonly selectableAccounts = computed(() =>
    this.availableAccounts().filter((a) => !a.isContainer),
  );

  readonly assignedTotal = computed(() => {
    const total = this.editableAssignments().reduce(
      (sum, a) => sum + parseFloat(a.value || '0'),
      0,
    );
    return total.toFixed(2);
  });

  readonly assignedPercentage = computed(() => {
    const total = parseFloat(this.transactionAmount());
    if (total <= 0) return 0;
    return (parseFloat(this.assignedTotal()) / total) * 100;
  });

  readonly hasUnsavedChanges = computed(() => {
    const current = this.editableAssignments();
    const original = this.originalAssignments();
    if (current.length !== original.length) return true;
    for (let i = 0; i < current.length; i++) {
      if (
        current[i].accountId !== original[i].accountId ||
        current[i].value !== original[i].value
      ) {
        return true;
      }
    }
    return false;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assignments']) {
      const list = this.assignments().map((a) => ({
        id: a.id,
        accountId: a.accountId,
        value: a.value,
      }));
      this.editableAssignments.set([...list]);
      this.originalAssignments.set(list.map((a) => ({ ...a })));
    }
  }

  onAccountChange(accountId: string, index: number): void {
    const list = this.editableAssignments();
    list[index] = { ...list[index], accountId };
    this.editableAssignments.set([...list]);
  }

  onValueChange(value: string, index: number): void {
    const list = this.editableAssignments();
    list[index] = { ...list[index], value };
    this.editableAssignments.set([...list]);
  }

  addAssignment(): void {
    this.editableAssignments.update((arr) => [
      ...arr,
      { id: '', accountId: '', value: '0.00' },
    ]);
  }

  removeAssignment(index: number): void {
    this.editableAssignments.set(
      this.editableAssignments().filter((_, i) => i !== index),
    );
  }

  save(): void {
    const orgId = this.organizationId();
    const txnId = this.transactionId();
    const current = this.editableAssignments();
    const original = this.originalAssignments();

    const toDelete: string[] = [];
    for (const orig of original) {
      if (!current.find((c) => c.id === orig.id)) {
        toDelete.push(orig.id);
      }
    }

    const toCreate: Array<{ accountId: string; value: string }> = [];
    const toUpdate: Array<{ id: string; accountId: string; value: string }> = [];
    for (const curr of current) {
      if (!curr.accountId) continue;
      if (!curr.id) {
        toCreate.push({ accountId: curr.accountId, value: curr.value });
      } else {
        const orig = original.find((o) => o.id === curr.id);
        if (
          orig &&
          (orig.accountId !== curr.accountId || orig.value !== curr.value)
        ) {
          toUpdate.push({
            id: curr.id,
            accountId: curr.accountId,
            value: curr.value,
          });
        }
      }
    }

    const operations: Observable<unknown>[] = [];
    for (const id of toDelete) {
      operations.push(this.dataService.deleteAssignment(orgId, txnId, id));
    }
    for (const c of toCreate) {
      operations.push(this.dataService.createAssignment(orgId, txnId, c));
    }
    for (const u of toUpdate) {
      operations.push(
        this.dataService.updateAssignment(orgId, txnId, u.id, u),
      );
    }

    if (operations.length === 0) {
      return;
    }

    this.saving.set(true);
    forkJoin(operations).subscribe({
      next: () => {
        // Rebuild a snapshot from the edited list so the parent can refresh
        // its row without an extra round-trip. Code/name are resolved from the
        // available accounts list.
        const accountsMap = new Map(
          this.selectableAccounts().map((a) => [a.id, a]),
        );
        const snapshot: JournalAccountAssignment[] = this.editableAssignments()
          .filter((a) => a.accountId)
          .map((a) => {
            const acct = accountsMap.get(a.accountId);
            return {
              id: a.id,
              accountId: a.accountId,
              accountCode: acct?.code ?? '',
              accountName: acct?.name ?? '',
              value: a.value,
            };
          });
        this.originalAssignments.set(
          this.editableAssignments().map((a) => ({ ...a })),
        );
        this.assignmentsChanged.emit(snapshot);
        this.saving.set(false);
        this.notifications.success(
          $localize`Zuweisungen erfolgreich gespeichert`,
        );
      },
      error: () => {
        this.notifications.error(
          $localize`Fehler beim Speichern der Zuweisungen`,
        );
        this.saving.set(false);
      },
    });
  }

  formatAmount(value: string): string {
    const num = parseFloat(value);
    return formatCurrency(num);
  }
}
