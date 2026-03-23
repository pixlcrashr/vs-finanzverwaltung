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
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
} from '../../../shared/components';
import { Account, AccountGroupAssignment } from '../../../shared/models';
import { AccountGroupEditDataService, AccountGroupDetails } from './account-group-edit.data-service';

@Component({
  selector: 'app-account-group-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    PageHeaderComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs()" />

      <div class="flex flex-1 justify-center overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" text="Kontengruppe wird geladen..." />
        } @else if (group()) {
          <div class="w-full max-w-4xl space-y-3">
            <!-- Group Details Form -->
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="text-sm font-semibold text-gray-900 mb-4">
                Gruppendetails
              </h2>

              <form [formGroup]="groupForm" (ngSubmit)="saveGroup()">
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
                </div>

                <div class="flex justify-end gap-2 mt-4">
                  <a
                    routerLink="/accountGroups"
                    class="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-50"
                  >
                    Abbrechen
                  </a>
                  <app-button
                    type="submit"
                    [disabled]="groupForm.invalid || groupForm.pristine"
                    [loading]="saving()"
                  >
                    Speichern
                  </app-button>
                </div>
              </form>
            </div>

            <!-- Assigned Accounts -->
            <div class="bg-white rounded-lg border border-gray-200">
              <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-gray-900">
                  Zugeordnete Konten
                </h3>
                <app-button (clicked)="openAddAccountDialog()">Konto hinzufügen</app-button>
              </div>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        Kontonummer
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        Kontoname
                      </th>
                      <th scope="col" class="px-3 py-2 text-right">
                        <span class="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    @for (assignment of group()!.assignments; track trackById(assignment)) {
                      <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-3 py-2 text-xs text-gray-900">{{ assignment.accountCode }}</td>
                        <td class="px-3 py-2 text-xs text-gray-900">{{ assignment.accountName }}</td>
                        <td class="px-3 py-2 text-right text-xs">
                          <button
                            type="button"
                            (click)="removeAssignment(assignment)"
                            class="text-xs text-red-600 hover:underline"
                          >
                            Entfernen
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Add Account Dialog Template -->
    <ng-template #addAccountDialogTemplate>
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-4">
          Konto hinzufügen
        </h2>

        <div class="space-y-3">
          <div>
            <label
              for="accountSelect"
              class="block text-xs font-medium text-gray-700 mb-1"
            >
              Konto auswählen
            </label>
            <select
              id="accountSelect"
              [(ngModel)]="selectedAccountId"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Bitte wählen...</option>
              @for (account of availableAccounts(); track account.id) {
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
            [disabled]="!selectedAccountId"
            [loading]="adding()"
            (clicked)="addAccount()"
          >
            Hinzufügen
          </app-button>
        </div>
      </div>
    </ng-template>
  `,
})
export class AccountGroupEditComponent implements OnInit {
  private readonly dataService = inject(AccountGroupEditDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(Dialog);

  readonly addAccountDialogTemplate = viewChild.required<TemplateRef<unknown>>('addAccountDialogTemplate');

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly adding = signal(false);
  readonly group = signal<AccountGroupDetails | null>(null);
  readonly availableAccounts = signal<Account[]>([]);

  selectedAccountId = '';

  readonly breadcrumbs = signal<BreadcrumbItem[]>([
    { label: 'Kontengruppen', path: '/accountGroups' },
    { label: 'Laden...' },
  ]);

  readonly groupForm: FormGroup;

  private dialogRef: ReturnType<typeof this.dialog.open> | null = null;
  private groupId = '';

  constructor() {
    this.groupForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.groupId = id;
      this.loadGroup(id);
    }
  }

  private loadGroup(id: string): void {
    this.dataService.getGroup(id).subscribe({
      next: (group) => {
        this.group.set(group);
        this.groupForm.patchValue({
          name: group.name,
          description: group.description,
        });
        this.breadcrumbs.set([
          { label: 'Kontengruppen', path: '/accountGroups' },
          { label: group.name },
          { label: 'Bearbeiten' },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/accountGroups']);
      },
    });
  }

  trackById = (item: AccountGroupAssignment) => item.id;

  saveGroup(): void {
    if (this.groupForm.invalid) return;

    this.saving.set(true);
    const { name, description } = this.groupForm.value;

    this.dataService.updateGroup(this.groupId, name, description).subscribe({
      next: () => {
        this.saving.set(false);
        this.groupForm.markAsPristine();
        this.loadGroup(this.groupId);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  openAddAccountDialog(): void {
    this.selectedAccountId = '';
    this.dataService.getAvailableAccounts().subscribe({
      next: (accounts) => {
        this.availableAccounts.set(accounts);
        this.dialogRef = this.dialog.open(this.addAccountDialogTemplate(), {
          panelClass: ['flex', 'items-center', 'justify-center'],
          backdropClass: 'bg-black/50',
          width: '500px'
        });
      },
    });
  }

  closeDialog(): void {
    this.dialogRef?.close();
    this.dialogRef = null;
  }

  addAccount(): void {
    if (!this.selectedAccountId) return;

    this.adding.set(true);

    this.dataService.addAssignment(this.groupId, this.selectedAccountId).subscribe({
      next: () => {
        this.adding.set(false);
        this.closeDialog();
        this.loadGroup(this.groupId);
      },
      error: () => {
        this.adding.set(false);
      },
    });
  }

  removeAssignment(assignment: AccountGroupAssignment): void {
    this.dataService.removeAssignment(this.groupId, assignment.id).subscribe({
      next: () => {
        this.loadGroup(this.groupId);
      },
    });
  }
}
