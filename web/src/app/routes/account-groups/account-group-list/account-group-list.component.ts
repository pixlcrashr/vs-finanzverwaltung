import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
  EmptyStateComponent,
} from '../../../shared/components';
import { AccountGroup } from '../../../shared/models';
import { AccountGroupListDataService } from './account-group-list.data-service';

@Component({
  selector: 'app-account-group-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DialogModule,
    PageHeaderComponent,
    ButtonComponent,
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
          <app-loading-spinner [fullPage]="true" text="Kontengruppen werden geladen..." />
        } @else if (groups().length === 0) {
          <app-empty-state
            title="Keine Kontengruppen vorhanden"
            description="Erstellen Sie Ihre erste Kontengruppe, um Konten zu gruppieren."
          >
            <app-button (clicked)="openCreateDialog()">Kontengruppe erstellen</app-button>
          </app-empty-state>
        } @else {
          <div class="w-full max-w-3xl">
            <div class="bg-white rounded-lg border border-gray-200">
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                    >
                      Beschreibung
                    </th>
                    <th
                      scope="col"
                      class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-right text-gray-500"
                    >
                      Zugeordnete Konten
                    </th>
                    <th scope="col" class="px-3 py-2 text-right">
                      <span class="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                  @for (group of groups(); track trackById(group)) {
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="px-3 py-2 text-xs text-gray-900">{{ group.name }}</td>
                      <td class="px-3 py-2 text-xs text-gray-900">
                        <div class="max-w-md truncate" [title]="group.description || ''">
                          {{ group.description || '-' }}
                        </div>
                      </td>
                      <td class="px-3 py-2 text-xs text-right text-gray-900">
                        {{ group.assignmentCount }}
                      </td>
                      <td class="px-3 py-2 text-right text-xs">
                        <div class="flex items-center justify-end gap-2">
                          <a
                            [routerLink]="['/accountGroups', group.id]"
                            class="text-xs text-blue-600 hover:underline"
                          >
                            Anzeigen
                          </a>
                          <a
                            [routerLink]="['/accountGroups', group.id, 'edit']"
                            class="text-xs text-blue-600 hover:underline"
                          >
                            Bearbeiten
                          </a>
                          <button
                            type="button"
                            (click)="confirmDelete(group)"
                            class="text-xs text-red-600 hover:underline"
                          >
                            Entfernen
                          </button>
                        </div>
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

    <!-- Create Dialog Template -->
    <ng-template #createDialogTemplate>
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-4">
          Kontengruppe erstellen
        </h2>

        <form [formGroup]="createForm" (ngSubmit)="createGroup()">
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

    <!-- Delete Confirmation Dialog Template -->
    <ng-template #deleteDialogTemplate>
      <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-2">
          Kontengruppe entfernen
        </h2>
        <p class="text-xs text-gray-500 mb-4">
          Sind Sie sicher, dass Sie die Kontengruppe "{{ groupToDelete()?.name }}"
          entfernen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
        </p>

        <div class="flex justify-end gap-2">
          <app-button variant="secondary" (clicked)="closeDialog()">Abbrechen</app-button>
          <app-button variant="danger" [loading]="deleting()" (clicked)="deleteGroup()">
            Entfernen
          </app-button>
        </div>
      </div>
    </ng-template>
  `,
})
export class AccountGroupListComponent implements OnInit {
  private readonly dataService = inject(AccountGroupListDataService);
  private readonly dialog = inject(Dialog);
  private readonly fb = inject(FormBuilder);

  readonly createDialogTemplate = viewChild.required<TemplateRef<unknown>>('createDialogTemplate');
  readonly deleteDialogTemplate = viewChild.required<TemplateRef<unknown>>('deleteDialogTemplate');

  readonly loading = signal(true);
  readonly creating = signal(false);
  readonly deleting = signal(false);
  readonly groups = signal<AccountGroup[]>([]);
  readonly groupToDelete = signal<AccountGroup | null>(null);

  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Kontengruppen' }];

  readonly createForm: FormGroup;

  private dialogRef: ReturnType<typeof this.dialog.open> | null = null;

  constructor() {
    this.createForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.loadGroups();
  }

  private loadGroups(): void {
    this.dataService.getGroups().subscribe({
      next: (groups) => {
        this.groups.set(groups);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  trackById = (group: AccountGroup) => group.id;

  openCreateDialog(): void {
    this.createForm.reset({
      name: '',
      description: '',
    });

    this.dialogRef = this.dialog.open(this.createDialogTemplate(), {
      panelClass: ['flex', 'items-center', 'justify-center'],
      backdropClass: 'bg-black/50',
      width: '500px'
    });
  }

  confirmDelete(group: AccountGroup): void {
    this.groupToDelete.set(group);
    this.dialogRef = this.dialog.open(this.deleteDialogTemplate(), {
      panelClass: ['flex', 'items-center', 'justify-center'],
      backdropClass: 'bg-black/50',
      width: '500px'
    });
  }

  closeDialog(): void {
    this.dialogRef?.close();
    this.dialogRef = null;
    this.groupToDelete.set(null);
  }

  createGroup(): void {
    if (this.createForm.invalid) return;

    this.creating.set(true);
    const { name, description } = this.createForm.value;

    this.dataService.createGroup(name, description || '').subscribe({
      next: () => {
        this.creating.set(false);
        this.closeDialog();
        this.loadGroups();
      },
      error: () => {
        this.creating.set(false);
      },
    });
  }

  deleteGroup(): void {
    const group = this.groupToDelete();
    if (!group) return;

    this.deleting.set(true);

    this.dataService.deleteGroup(group.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.closeDialog();
        this.loadGroups();
      },
      error: () => {
        this.deleting.set(false);
      },
    });
  }
}
