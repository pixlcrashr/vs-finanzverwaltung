import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { forkJoin, timer } from 'rxjs';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  StatusBadgeComponent,
  LoadingSpinnerComponent,
  EmptyStateComponent,
} from '../../../shared/components';
import { Account } from '../../../shared/models';
import { AccountListDataService } from './account-list.data-service';

@Component({
  selector: 'app-account-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgTemplateOutlet,
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
          <app-loading-spinner [fullPage]="true" text="Konten werden geladen..." />
        } @else if (accounts().length === 0) {
          <app-empty-state
            title="Keine Konten vorhanden"
            description="Erstellen Sie Ihr erstes Konto, um mit der Buchführung zu beginnen."
          >
            <app-button (clicked)="openCreateDialog()">Konto erstellen</app-button>
          </app-empty-state>
        } @else {
          <div class="w-full max-w-3xl">
            <div class="bg-white rounded-lg border border-gray-200">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th scope="col" class="px-2.5 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        Kontonummer
                      </th>
                      <th scope="col" class="px-2.5 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        Name
                      </th>
                      <th scope="col" class="px-2.5 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        Beschreibung
                      </th>
                      <th scope="col" class="px-2.5 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th scope="col" class="px-2.5 py-1.5 text-right">
                        <span class="sr-only">Aktionen</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    @for (account of accounts(); track account.id) {
                      <ng-container *ngTemplateOutlet="accountRow; context: { $implicit: account }" />
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Account Row Template (recursive) -->
    <ng-template #accountRow let-account>
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-2.5 py-1.5 text-xs text-gray-900">
          <span [style.padding-left.rem]="account.depth * 1.25">
            @if (account.children.length > 0) {
              <svg
                class="mr-1.5 h-3 w-3 inline-block text-gray-400"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                aria-hidden="true"
              >
                <path d="M5 7.5 10 12.5 15 7.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            } @else {
              <span class="mr-1.5 inline-block w-3"></span>
            }
            {{ account.code }}
          </span>
        </td>
        <td class="px-2.5 py-1.5 text-xs text-gray-900">
          {{ account.name }}
        </td>
        <td class="px-2.5 py-1.5 text-[11px] text-gray-500">
          <div class="max-w-xs truncate" [title]="account.description || ''">
            {{ account.description || '-' }}
          </div>
        </td>
        <td class="px-2.5 py-1.5 text-xs">
          <app-status-badge size="sm" [variant]="account.isArchived ? 'neutral' : 'success'">
            {{ account.isArchived ? 'Archiviert' : 'Aktiv' }}
          </app-status-badge>
        </td>
        <td class="px-2.5 py-1.5 text-right text-xs">
          <div class="flex items-center justify-end gap-2">
            @if (account.isArchived) {
              <button
                type="button"
                class="text-xs text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                [disabled]="isMutatingAccount(account.id)"
                (click)="restoreAccount(account)"
              >
                {{ restoringAccountId() === account.id ? 'Wird wiederhergestellt...' : 'Wiederherstellen' }}
              </button>
            } @else {
              <button
                type="button"
                class="text-xs text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                [disabled]="isMutatingAccount(account.id)"
                (click)="archiveAccount(account)"
              >
                {{ archivingAccountId() === account.id ? 'Wird archiviert...' : 'Archivieren' }}
              </button>
            }
            <a
              [routerLink]="['/accounts', account.id]"
              class="text-xs text-blue-600 hover:underline"
            >
              Bearbeiten
            </a>
          </div>
        </td>
      </tr>
      @for (child of account.children; track child.id) {
        <ng-container *ngTemplateOutlet="accountRow; context: { $implicit: child }" />
      }
    </ng-template>

    <!-- Create Dialog Template -->
    <ng-template #createDialogTemplate>
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-4">
          Konto erstellen
        </h2>

        <form [formGroup]="createForm" (ngSubmit)="createAccount()">
          <div class="space-y-3">
            <div>
              <label
                for="code"
                class="block text-xs font-medium text-gray-700 mb-1"
              >
                Kontonummer
              </label>
              <input
                id="code"
                type="text"
                formControlName="code"
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

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

            <div>
              <label
                for="parentAccount"
                class="block text-xs font-medium text-gray-700 mb-1"
              >
                Übergeordnetes Konto (optional)
              </label>
              <select
                id="parentAccount"
                formControlName="parentAccountId"
                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Kein übergeordnetes Konto</option>
                @for (account of flatAccounts(); track account.id) {
                  <option [value]="account.id">
                    {{ account.code }} - {{ account.name }}
                  </option>
                }
              </select>
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
  `,
})
export class AccountListComponent implements OnInit {
  private readonly dataService = inject(AccountListDataService);
  private readonly dialog = inject(Dialog);
  private readonly fb = inject(FormBuilder);

  readonly createDialogTemplate = viewChild.required<TemplateRef<unknown>>('createDialogTemplate');

  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly archivingAccountId = signal<string | null>(null);
  readonly restoringAccountId = signal<string | null>(null);
  readonly accounts = signal<Account[]>([]);
  readonly expandedIds = signal<Set<string>>(new Set());
  readonly flatAccounts = signal<Account[]>([]);

  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Haushaltskonten' }];

  readonly createForm: FormGroup;

  private dialogRef: ReturnType<typeof this.dialog.open> | null = null;

  constructor() {
    this.createForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      description: [''],
      parentAccountId: [''],
    });
  }

  ngOnInit(): void {
    this.loadAccounts();
  }

  private loadAccounts(): void {
    this.dataService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.flatAccounts.set(this.flattenAccounts(accounts));
        // Expand all by default
        const ids = new Set<string>();
        this.collectIds(accounts, ids);
        this.expandedIds.set(ids);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private flattenAccounts(accounts: Account[]): Account[] {
    const flat: Account[] = [];
    for (const account of accounts) {
      flat.push(account);
      flat.push(...this.flattenAccounts(account.children));
    }
    return flat;
  }

  private collectIds(accounts: Account[], ids: Set<string>): void {
    for (const account of accounts) {
      if (account.children.length > 0) {
        ids.add(account.id);
        this.collectIds(account.children, ids);
      }
    }
  }

  toggleExpanded(id: string): void {
    const ids = new Set(this.expandedIds());
    if (ids.has(id)) {
      ids.delete(id);
    } else {
      ids.add(id);
    }
    this.expandedIds.set(ids);
  }

  openCreateDialog(): void {
    this.createForm.reset({
      code: '',
      name: '',
      description: '',
      parentAccountId: '',
    });

    this.dialogRef = this.dialog.open(this.createDialogTemplate(), {
      panelClass: ['flex', 'items-center', 'justify-center'],
      backdropClass: 'bg-black/50',
      width: '500px',
    });
  }

  closeDialog(): void {
    this.dialogRef?.close();
    this.dialogRef = null;
  }

  createAccount(): void {
    if (this.createForm.invalid) return;

    this.creating.set(true);
    const { code, name, description, parentAccountId } = this.createForm.value;

    this.dataService
      .createAccount(name, code, description || '', parentAccountId || null)
      .subscribe({
        next: () => {
          this.creating.set(false);
          this.closeDialog();
          this.loadAccounts();
        },
        error: () => {
          this.creating.set(false);
        },
      });
  }

  isMutatingAccount(id: string): boolean {
    return this.archivingAccountId() === id || this.restoringAccountId() === id;
  }

  archiveAccount(account: Account): void {
    if (this.isMutatingAccount(account.id)) return;

    this.archivingAccountId.set(account.id);
    forkJoin([this.dataService.archiveAccount(account.id), timer(500)]).subscribe({
      next: () => {
        this.archivingAccountId.set(null);
        this.loadAccounts();
      },
      error: () => {
        this.archivingAccountId.set(null);
      },
    });
  }

  restoreAccount(account: Account): void {
    if (this.isMutatingAccount(account.id)) return;

    this.restoringAccountId.set(account.id);
    forkJoin([this.dataService.restoreAccount(account.id), timer(500)]).subscribe({
      next: () => {
        this.restoringAccountId.set(null);
        this.loadAccounts();
      },
      error: () => {
        this.restoringAccountId.set(null);
      },
    });
  }
}
