import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { Dialog } from '@angular/cdk/dialog';
import { concat, forkJoin, merge, map, distinctUntilChanged, filter, timer, switchMap, EMPTY } from 'rxjs';
import {
  PageContentLayoutComponent,
  BreadcrumbItem,
  ButtonComponent,
  StatusBadgeComponent,
  LoadingSpinnerComponent,
  EmptyStateComponent,
  NotificationService,
} from '../../../shared/components';
import {
  CreateAccountDialogComponent,
  CreateAccountDialogInput,
  CreateAccountDialogOutput,
} from '../../../shared/dialogs/create-account-dialog/create-account-dialog.component';
import {
  ConfirmDeleteDialogComponent,
  ConfirmDeleteDialogInput,
  ConfirmDeleteDialogOutput,
} from '../../../shared/dialogs/confirm-delete-dialog/confirm-delete-dialog.component';
import { Account } from '../../../shared/models';
import { AccountListDataService } from './account-list.data-service';

@Component({
  selector: 'app-account-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    NgTemplateOutlet,
    PageContentLayoutComponent,
    ButtonComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs">
      <app-button layout-header-actions (clicked)="openCreateDialog()"><ng-container i18n>Hinzufügen</ng-container></app-button>

      <div layout-content class="flex flex-1 justify-center">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Konten werden geladen..." />
        } @else if (accounts().length === 0) {
          <app-empty-state
            i18n-title title="Keine Konten vorhanden"
            i18n-description description="Erstellen Sie Ihr erstes Konto, um mit der Buchführung zu beginnen."
          >
            <app-button (clicked)="openCreateDialog()"><ng-container i18n>Konto erstellen</ng-container></app-button>
          </app-empty-state>
        } @else {
          <div class="w-full max-w-3xl">
            <div class="bg-white rounded-lg border border-gray-200">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th scope="col" class="px-2.5 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        <ng-container i18n>Kontonummer</ng-container>
                      </th>
                      <th scope="col" class="px-2.5 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        <ng-container i18n>Name</ng-container>
                      </th>
                      <th scope="col" class="px-2.5 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        <ng-container i18n>Beschreibung</ng-container>
                      </th>
                      <th scope="col" class="px-2.5 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        <ng-container i18n>Status</ng-container>
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
    </app-page-content-layout>

    <!-- Account Row Template (recursive) -->
    <ng-template #accountRow let-account>
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-2.5 py-1.5 text-xs text-gray-900">
          <span [style.padding-left.rem]="account.depth * 1.25">
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
            <ng-container i18n>{{ account.isArchived ? 'Archiviert' : 'Aktiv' }}</ng-container>
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
                <ng-container i18n>{{ restoringAccountId() === account.id ? 'Wird wiederhergestellt...' : 'Wiederherstellen' }}</ng-container>
              </button>
              <button
                type="button"
                class="text-xs text-red-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                [disabled]="isMutatingAccount(account.id)"
                (click)="openDeleteDialog(account)"
              >
                <ng-container i18n>{{ deletingAccountId() === account.id ? 'Wird gelöscht...' : 'Löschen' }}</ng-container>
              </button>
            } @else if (canArchive(account)) {
              <button
                type="button"
                class="text-xs text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                [disabled]="isMutatingAccount(account.id)"
                (click)="archiveAccount(account)"
              >
                <ng-container i18n>{{ archivingAccountId() === account.id ? 'Wird archiviert...' : 'Archivieren' }}</ng-container>
              </button>
            }
            <a
              [routerLink]="['/organizations', orgId, 'accounts', account.id]"
              class="text-xs text-blue-600 hover:underline"
            >
              <ng-container i18n>Bearbeiten</ng-container>
            </a>
          </div>
        </td>
      </tr>
      @for (child of account.children; track child.id) {
        <ng-container *ngTemplateOutlet="accountRow; context: { $implicit: child }" />
      }
    </ng-template>
  `,
})
export class AccountListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly dataService = inject(AccountListDataService);
  private readonly dialog = inject(Dialog);
  private readonly notifications = inject(NotificationService);

  orgId = '';

  readonly loading = signal(true);
  readonly archivingAccountId = signal<string | null>(null);
  readonly restoringAccountId = signal<string | null>(null);
  readonly deletingAccountId = signal<string | null>(null);
  readonly accounts = signal<Account[]>([]);
  readonly expandedIds = signal<Set<string>>(new Set());

  readonly breadcrumbs: BreadcrumbItem[] = [{ label: $localize`Haushaltskonten` }];

  constructor() {
    merge(...this.route.pathFromRoot.map(r => r.params)).pipe(
      map(params => params['orgId'] as string | undefined),
      filter((id): id is string => !!id),
      distinctUntilChanged(),
      takeUntilDestroyed(),
    ).subscribe(id => {
      this.orgId = id;
      this.loading.set(true);
      this.accounts.set([]);
      this.loadAccounts();
    });
  }

  private loadAccounts(): void {
    this.dataService.listAccounts(this.orgId).subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        const ids = new Set<string>();
        this.collectIds(accounts, ids);
        this.expandedIds.set(ids);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.error($localize`Fehler beim Laden der Konten`);
      },
    });
  }

  private collectIds(accounts: Account[], ids: Set<string>): void {
    for (const account of accounts) {
      if (account.children.length > 0) {
        ids.add(account.id);
        this.collectIds(account.children, ids);
      }
    }
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open<CreateAccountDialogOutput, CreateAccountDialogInput>(
      CreateAccountDialogComponent,
      {
        backdropClass: 'cdk-overlay-dark-backdrop',
        width: '500px',
        data: { organizationId: this.orgId },
      }
    );

    dialogRef.closed.subscribe((result) => {
      if (result?.created) {
        this.loadAccounts();
      }
    });
  }

  canArchive(account: Account): boolean {
    return this.allChildrenArchived(account.children);
  }

  private findArchivedAncestors(targetId: string, nodes: Account[]): string[] | null {
    for (const node of nodes) {
      if (node.id === targetId) {
        return [];
      }
      const descendantResult = this.findArchivedAncestors(targetId, node.children);
      if (descendantResult !== null) {
        const ids: string[] = [];
        if (node.isArchived) {
          ids.push(node.id);
        }
        ids.push(...descendantResult);
        return ids;
      }
    }
    return null;
  }

  private allChildrenArchived(children: Account[]): boolean {
    return children.every((child) => child.isArchived && this.allChildrenArchived(child.children));
  }

  isMutatingAccount(id: string): boolean {
    return this.archivingAccountId() === id || this.restoringAccountId() === id || this.deletingAccountId() === id;
  }

  openDeleteDialog(account: Account): void {
    if (this.isMutatingAccount(account.id)) return;

    const dialogRef = this.dialog.open<ConfirmDeleteDialogOutput, ConfirmDeleteDialogInput>(
      ConfirmDeleteDialogComponent,
      {
        backdropClass: 'cdk-overlay-dark-backdrop',
        width: '400px',
        data: {
          title: $localize`Konto löschen`,
          message: $localize`Möchten Sie das Konto wirklich unwiderruflich löschen?`,
          itemName: `${account.code} – ${account.name}`,
        },
      },
    );

    dialogRef.closed.pipe(
      switchMap((result) => {
        if (!result?.confirmed) return EMPTY;
        this.deletingAccountId.set(account.id);
        return forkJoin([this.dataService.deleteAccount(this.orgId, account.id), timer(500)]);
      }),
    ).subscribe({
      next: () => {
        this.deletingAccountId.set(null);
        this.loadAccounts();
      },
      error: () => {
        this.deletingAccountId.set(null);
        this.notifications.error($localize`Fehler beim Löschen des Kontos`);
      },
    });
  }

  archiveAccount(account: Account): void {
    if (this.isMutatingAccount(account.id)) return;

    this.archivingAccountId.set(account.id);
    forkJoin([this.dataService.archiveAccount(this.orgId, account.id), timer(500)]).subscribe({
      next: () => {
        this.archivingAccountId.set(null);
        this.loadAccounts();
      },
      error: () => {
        this.archivingAccountId.set(null);
        this.notifications.error($localize`Fehler beim Archivieren des Kontos`);
      },
    });
  }

  restoreAccount(account: Account): void {
    if (this.isMutatingAccount(account.id)) return;

    const archivedAncestorIds = this.findArchivedAncestors(account.id, this.accounts()) ?? [];
    const restoreCalls = [account.id, ...archivedAncestorIds]
      .map((id) => this.dataService.restoreAccount(this.orgId, id));

    this.restoringAccountId.set(account.id);
    forkJoin([concat(...restoreCalls), timer(500)]).subscribe({
      next: () => {
        this.restoringAccountId.set(null);
        this.loadAccounts();
      },
      error: () => {
        this.restoringAccountId.set(null);
        this.notifications.error($localize`Fehler beim Wiederherstellen des Kontos`);
      },
    });
  }
}
