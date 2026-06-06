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
import { Organization } from '../../../shared/models';
import { OrganizationEditDataService } from './organization-edit.data-service';

@Component({
  selector: 'app-organization-edit',
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
          <app-loading-spinner [fullPage]="true" i18n-text text="Organisation wird geladen..." />
        } @else if (organization()) {
          <div class="w-full max-w-4xl">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <!-- Left Column: Form (auto-saving) -->
              <div class="lg:col-span-2 space-y-4">
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <div class="flex items-center justify-between mb-4">
                    <h2 i18n class="text-sm font-semibold text-gray-900">
                      Organisationsdetails
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

                  <form [formGroup]="organizationForm">
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
                          rows="3"
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
                      <dt i18n class="text-xs text-gray-500">ID</dt>
                      <dd class="text-sm text-gray-900 font-mono">{{ organization()!.id }}</dd>
                    </div>
                  </dl>
                </div>

                <!-- Actions Card -->
                <div class="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 i18n class="text-xs font-semibold text-gray-500 uppercase mb-3">Aktionen</h3>
                  <div class="space-y-2">
                    <button
                      (click)="enterOrganization()"
                      class="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      i18n
                    >
                      Organisation öffnen
                    </button>
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
export class OrganizationEditComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly dataService = inject(OrganizationEditDataService);
  private readonly notifications = inject(NotificationService);

  private readonly destroy$ = new Subject<void>();

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly organization = signal<Organization | null>(null);
  readonly breadcrumbs = signal<BreadcrumbItem[]>([
    { label: $localize`Organisationen`, path: '/admin/organizations' },
    { label: $localize`Laden...` },
  ]);

  readonly organizationForm: FormGroup;

  private organizationId = '';

  constructor() {
    this.organizationForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.organizationId = this.route.snapshot.paramMap.get('id') || '';
    if (this.organizationId) {
      this.loadOrganization();
      this.setupAutoSave();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAutoSave(): void {
    this.organizationForm.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(500),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      filter(() => this.organizationForm.valid && this.organizationForm.dirty && !this.loading())
    ).subscribe(() => {
      this.saveOrganization();
    });
  }

  private loadOrganization(): void {
    this.dataService.getOrganization(this.organizationId).subscribe({
      next: (org) => {
        this.organization.set(org);
        this.organizationForm.patchValue({
          name: org.name,
          description: org.description ?? '',
        }, { emitEvent: false });
        this.organizationForm.markAsPristine();
        this.breadcrumbs.set([
          { label: $localize`Organisationen`, path: '/admin/organizations' },
          { label: org.name },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Laden der Organisation`);
        this.loading.set(false);
        this.router.navigate(['/admin/organizations']);
      },
    });
  }

  private saveOrganization(): void {
    if (this.organizationForm.invalid) return;

    this.saving.set(true);
    const { name, description } = this.organizationForm.value;

    this.dataService.updateOrganization(this.organizationId, {
      name: name.trim(),
      description: description.trim(),
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.organizationForm.markAsPristine();
        // Update breadcrumbs with new name
        this.breadcrumbs.set([
          { label: $localize`Organisationen`, path: '/admin/organizations' },
          { label: name.trim() },
        ]);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Speichern der Organisation`);
        this.saving.set(false);
      },
    });
  }

  enterOrganization(): void {
    this.router.navigate(['/organizations', this.organizationId, 'dashboard']);
  }
}
