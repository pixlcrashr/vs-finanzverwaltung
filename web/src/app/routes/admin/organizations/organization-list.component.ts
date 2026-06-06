import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  PageContentLayoutComponent,
  BreadcrumbItem,
  LoadingSpinnerComponent,
  EmptyStateComponent,
  NotificationService,
  ButtonComponent,
} from '../../../shared/components';
import { Organization } from '../../../shared/models';
import { OrganizationListDataService } from './organization-list.data-service';

@Component({
  selector: 'app-organization-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageContentLayoutComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ButtonComponent,
  ],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs">
      <app-button layout-header-actions (clicked)="openCreateForm()">
        <ng-container i18n>Hinzufügen</ng-container>
      </app-button>

      <div layout-content class="flex flex-1 justify-center">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" i18n-text text="Organisationen werden geladen..." />
        } @else if (showCreateForm()) {
          <div class="w-full max-w-md">
            <div class="bg-white rounded-lg border border-gray-200 p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4" i18n>Neue Organisation erstellen</h3>
              <form (ngSubmit)="createOrganization()" class="space-y-4">
                <div>
                  <label for="orgName" class="block text-xs font-medium text-gray-700 mb-1" i18n>Name</label>
                  <input
                    type="text"
                    id="orgName"
                    [(ngModel)]="newOrgName"
                    name="orgName"
                    required
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    i18n-placeholder
                    placeholder="Organisationsname"
                  />
                </div>
                <div>
                  <label for="orgDescription" class="block text-xs font-medium text-gray-700 mb-1" i18n>Beschreibung</label>
                  <textarea
                    id="orgDescription"
                    [(ngModel)]="newOrgDescription"
                    name="orgDescription"
                    rows="3"
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    i18n-placeholder
                    placeholder="Kurze Beschreibung..."
                  ></textarea>
                </div>
                <div class="flex gap-2">
                  <button
                    type="submit"
                    [disabled]="!newOrgName.trim()"
                    class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    i18n
                  >
                    Erstellen
                  </button>
                  <button
                    type="button"
                    (click)="cancelCreate()"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none"
                    i18n
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            </div>
          </div>
        } @else if (organizations().length === 0) {
          <app-empty-state
            i18n-title title="Keine Organisationen vorhanden"
            i18n-description description="Erstellen Sie Ihre erste Organisation, um zu beginnen."
          >
            <app-button (clicked)="openCreateForm()">
              <ng-container i18n>Organisation erstellen</ng-container>
            </app-button>
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
                        <ng-container i18n>Name</ng-container>
                      </th>
                      <th
                        scope="col"
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        <ng-container i18n>Beschreibung</ng-container>
                      </th>
                      <th scope="col" class="px-3 py-2 text-right">
                        <span class="sr-only">Aktionen</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    @for (org of organizations(); track org.id) {
                      <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-3 py-2 text-xs text-gray-900">{{ org.name }}</td>
                        <td class="px-3 py-2 text-xs text-gray-500">{{ org.description || '-' }}</td>
                        <td class="px-3 py-2 text-right text-xs space-x-2">
                          <button
                            (click)="enterOrganization(org.id)"
                            class="text-xs text-blue-600 hover:underline"
                            i18n
                          >
                            Öffnen
                          </button>
                          <button
                            (click)="deleteOrganization(org.id)"
                            class="text-xs text-red-600 hover:underline"
                            i18n
                          >
                            Löschen
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
    </app-page-content-layout>
  `,
})
export class OrganizationListComponent implements OnInit {
  private readonly organizationListDataService = inject(OrganizationListDataService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly organizations = signal<Organization[]>([]);
  readonly showCreateForm = signal(false);
  newOrgName = '';
  newOrgDescription = '';

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: $localize`Administration`, path: '/admin' },
    { label: $localize`Organisationen` },
  ];

  ngOnInit(): void {
    this.loadOrganizations();
  }

  private loadOrganizations(): void {
    this.loading.set(true);
    this.organizationListDataService.getOrganizations().subscribe({
      next: (orgs) => {
        this.organizations.set(orgs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error($localize`Fehler beim Laden der Organisationen`);
      },
    });
  }

  openCreateForm(): void {
    this.showCreateForm.set(true);
    this.newOrgName = '';
    this.newOrgDescription = '';
  }

  cancelCreate(): void {
    this.showCreateForm.set(false);
    this.newOrgName = '';
    this.newOrgDescription = '';
  }

  createOrganization(): void {
    const name = this.newOrgName.trim();
    const description = this.newOrgDescription.trim();
    if (!name) return;

    const newOrg: Organization = {
      id: crypto.randomUUID(),
      name,
      description,
    };

    this.organizations.update((orgs) => [newOrg, ...orgs]);
    this.showCreateForm.set(false);
    this.newOrgName = '';
    this.newOrgDescription = '';
    this.notificationService.success($localize`Organisation erstellt`);
  }

  deleteOrganization(id: string): void {
    if (!confirm($localize`Sind Sie sicher, dass Sie diese Organisation löschen möchten?`)) {
      return;
    }

    this.organizationListDataService.deleteOrganization(id).subscribe({
      next: () => {
        this.organizations.update((orgs) => orgs.filter((o) => o.id !== id));
        this.notificationService.success($localize`Organisation gelöscht`);
      },
      error: () => {
        this.notificationService.error($localize`Fehler beim Löschen der Organisation`);
      },
    });
  }

  editOrganization(id: string): void {
    this.router.navigate(['/admin/organizations', id, 'edit']);
  }

  enterOrganization(id: string): void {
    this.router.navigate(['/organizations', id, 'dashboard']);
  }
}
