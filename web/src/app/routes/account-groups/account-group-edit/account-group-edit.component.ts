import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from '@angular/cdk/dialog';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import {
  PageContentLayoutComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
  NotificationService,
} from '../../../shared/components';
import {
  AddAccountToGroupDialogComponent,
  AddAccountToGroupDialogInput,
  AddAccountToGroupDialogOutput,
} from '../../../shared/dialogs/add-account-to-group-dialog/add-account-to-group-dialog.component';
import { AccountGroupAssignment } from '../../../shared/models';
import { AccountGroupEditDataService, AccountGroupDetails } from './account-group-edit.data-service';

@Component({
  selector: 'app-account-group-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    PageContentLayoutComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs()">
      <div layout-content class="flex flex-1 justify-center">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Kontengruppe wird geladen..." />
        } @else if (group()) {
          <div class="w-full max-w-4xl">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <!-- Left Column: Form (auto-saving) + Assigned Accounts -->
              <div class="lg:col-span-2 space-y-4">
                <!-- Group Details Form -->
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <div class="flex items-center justify-between mb-4">
                    <h2 i18n class="text-sm font-semibold text-gray-900">
                      Gruppendetails
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

                  <form [formGroup]="groupForm">
                    <div class="space-y-3">
                      <div>
                        <label
                          for="name"
                          class="block text-xs font-medium text-gray-700 mb-1"
                        >
                          <ng-container i18n>Name</ng-container>
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
                          class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                      </div>
                    </div>
                  </form>
                </div>

                <!-- Assigned Accounts -->
                <div class="bg-white rounded-lg border border-gray-200">
                  <div class="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 i18n class="text-sm font-semibold text-gray-900">
                      Zugeordnete Konten
                    </h3>
                    <app-button size="sm" (clicked)="openAddAccountDialog()"><ng-container i18n>Konto hinzufügen</ng-container></app-button>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                          >
                            <ng-container i18n>Kontonummer</ng-container>
                          </th>
                          <th
                            scope="col"
                            class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                          >
                            <ng-container i18n>Kontoname</ng-container>
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
                                <ng-container i18n>Entfernen</ng-container>
                              </button>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Right Column: Actions -->
              <div class="space-y-4">
                <!-- Actions Card -->
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 i18n class="text-xs font-semibold text-gray-500 uppercase mb-3">Aktionen</h3>
                  <div class="space-y-2">
                    <a
                      [routerLink]="['/accountGroups', groupId, 'stats']"
                      class="block w-full px-3 py-2 text-xs font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                    >
                      <ng-container i18n>Statistik anzeigen</ng-container>
                    </a>
                    <a
                      routerLink="/accountGroups"
                      class="block w-full px-3 py-2 text-xs font-medium text-center text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <ng-container i18n>Zurück zur Liste</ng-container>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </app-page-content-layout>
  `,
})
export class AccountGroupEditComponent implements OnInit, OnDestroy {
  private readonly dataService = inject(AccountGroupEditDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(Dialog);
  private readonly notifications = inject(NotificationService);

  private readonly destroy$ = new Subject<void>();

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly group = signal<AccountGroupDetails | null>(null);

  readonly breadcrumbs = signal<BreadcrumbItem[]>([
    { label: $localize`Kontengruppen`, path: '/accountGroups' },
    { label: $localize`Laden...` },
  ]);

  readonly groupForm: FormGroup;

  groupId = '';

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
      this.setupAutoSave();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAutoSave(): void {
    this.groupForm.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(500),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      filter(() => this.groupForm.valid && this.groupForm.dirty && !this.loading())
    ).subscribe(() => {
      this.saveGroup();
    });
  }

  private loadGroup(id: string): void {
    this.dataService.getGroup(id).subscribe({
      next: (group) => {
        this.group.set(group);
        this.groupForm.patchValue({
          name: group.name,
          description: group.description,
        }, { emitEvent: false });
        this.groupForm.markAsPristine();
        this.breadcrumbs.set([
          { label: $localize`Kontengruppen`, path: '/accountGroups' },
          { label: group.name },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notifications.error($localize`Fehler beim Laden der Kontengruppe`);
        this.router.navigate(['/accountGroups']);
      },
    });
  }

  trackById = (item: AccountGroupAssignment) => item.id;

  private saveGroup(): void {
    if (this.groupForm.invalid) return;

    this.saving.set(true);
    const { name, description } = this.groupForm.value;

    this.dataService.updateGroup(this.groupId, name, description).subscribe({
      next: () => {
        this.saving.set(false);
        this.groupForm.markAsPristine();
        // Update breadcrumbs with new name
        this.breadcrumbs.set([
          { label: $localize`Kontengruppen`, path: '/accountGroups' },
          { label: name },
        ]);
      },
      error: () => {
        this.saving.set(false);
        this.notifications.error($localize`Fehler beim Speichern der Kontengruppe`);
      },
    });
  }

  openAddAccountDialog(): void {
    const dialogRef = this.dialog.open<AddAccountToGroupDialogOutput, AddAccountToGroupDialogInput>(
      AddAccountToGroupDialogComponent,
      {
        backdropClass: 'cdk-overlay-dark-backdrop',
        width: '500px',
        data: {
          groupId: this.groupId,
        },
      }
    );

    dialogRef.closed.subscribe((result) => {
      if (result?.added) {
        this.loadGroup(this.groupId);
      }
    });
  }

  removeAssignment(assignment: AccountGroupAssignment): void {
    this.dataService.removeAssignment(this.groupId, assignment.id).subscribe({
      next: () => {
        this.loadGroup(this.groupId);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Entfernen des Kontos`);
      },
    });
  }
}
