import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import {
  PageContentLayoutComponent,
  BreadcrumbItem,
  LoadingSpinnerComponent,
  NotificationService,
} from '../../../shared/components';
import { formatDateShort } from '../../../shared/utils';
import { UserGroup } from '../../../shared/models';
import { GroupEditDataService } from './group-edit.data-service';

@Component({
  selector: 'app-group-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PageContentLayoutComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs()">
      <div layout-content class="flex flex-1 justify-center">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Gruppe wird geladen..." />
        } @else if (group()) {
          <div class="w-full max-w-4xl">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <!-- Left Column: Form (auto-saving) -->
              <div class="lg:col-span-2 space-y-4">
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
                          <ng-container i18n>Name *</ng-container>
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
                          class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              <!-- Right Column: Info & Actions -->
              <div class="space-y-4">
                <!-- Info Card -->
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 i18n class="text-xs font-semibold text-gray-500 uppercase mb-3">Informationen</h3>
                  <dl class="space-y-3">
                    <div>
                      <dt i18n class="text-xs text-gray-500">Erstellt am</dt>
                      <dd class="text-sm text-gray-900">{{ formatDate(group()!.createdAt) }}</dd>
                    </div>
                    <div>
                      <dt i18n class="text-xs text-gray-500">Zuletzt geändert</dt>
                      <dd class="text-sm text-gray-900">{{ formatDate(group()!.updatedAt) }}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </app-page-content-layout>
  `,
})
export class GroupEditComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly dataService = inject(GroupEditDataService);
  private readonly notifications = inject(NotificationService);

  private readonly destroy$ = new Subject<void>();

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly group = signal<UserGroup | null>(null);

  readonly breadcrumbs = signal<BreadcrumbItem[]>([
    { label: $localize`Gruppen`, path: '/admin/groups' },
    { label: $localize`Laden...` },
  ]);

  readonly groupForm: FormGroup;

  private groupId = '';

  constructor() {
    this.groupForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id') || '';
    if (this.groupId) {
      this.loadGroup();
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

  private loadGroup(): void {
    this.dataService.getGroup(this.groupId).subscribe({
      next: (group) => {
        this.group.set(group);
        this.groupForm.patchValue({
          name: group.name,
          description: group.description ?? '',
        }, { emitEvent: false });
        this.groupForm.markAsPristine();
        this.breadcrumbs.set([
          { label: $localize`Gruppen`, path: '/admin/groups' },
          { label: group.name },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden der Gruppe`);
        this.loading.set(false);
        this.router.navigate(['/admin/groups']);
      },
    });
  }

  private saveGroup(): void {
    if (this.groupForm.invalid) return;

    this.saving.set(true);
    const { name, description } = this.groupForm.value;

    this.dataService.updateGroup(this.groupId, {
      name: name.trim(),
      description: description.trim(),
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.groupForm.markAsPristine();
        // Update breadcrumbs with new name
        this.breadcrumbs.set([
          { label: $localize`Gruppen`, path: '/admin/groups' },
          { label: name.trim() },
        ]);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Speichern der Gruppe`);
        this.saving.set(false);
      },
    });
  }

  formatDate(date: Date): string {
    return formatDateShort(date);
  }
}
