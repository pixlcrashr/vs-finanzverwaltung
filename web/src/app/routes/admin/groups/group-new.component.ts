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
  ButtonComponent,
  NotificationService,
  AdminContentHeaderComponent,
  AdminContentComponent,
} from '../../../shared/components';
import { GroupNewDataService } from './group-new.data-service';
import { OrganizationListDataService } from '../organizations/organization-list.data-service';
import { Organization } from '../../../shared/models';

@Component({
  selector: 'app-group-new',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ButtonComponent,
    AdminContentHeaderComponent,
    AdminContentComponent,
  ],
  template: `
    <div class="flex flex-col h-full min-h-0">
      <app-admin-content-header>
          <app-button variant="secondary" (clicked)="cancel()">
            <ng-container i18n>Abbrechen</ng-container>
          </app-button>
          <app-button
            variant="primary"
            [disabled]="saving() || !isValid()"
            (clicked)="save()"
          >
            <ng-container i18n>{{ saving() ? 'Wird erstellt...' : 'Erstellen' }}</ng-container>
          </app-button>
      </app-admin-content-header>
      <app-admin-content>
        <div class="w-full max-w-3xl">
          <div class="bg-white rounded-lg border border-gray-200 p-4">
            <h2 i18n class="text-sm font-semibold text-gray-900 mb-4">
              Neue Gruppe erstellen
            </h2>
            <div class="space-y-3">
              <div>
                <label
                  for="name"
                  class="block text-xs font-medium text-gray-500 mb-1"
                >
                  <ng-container i18n>Name *</ng-container>
                </label>
                <input
                  id="name"
                  type="text"
                  [(ngModel)]="name"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="z.B. Administratoren"
                />
              </div>
              <div>
                <label
                  for="description"
                  class="block text-xs font-medium text-gray-500 mb-1"
                >
                  <ng-container i18n>Beschreibung</ng-container>
                </label>
                <textarea
                  id="description"
                  [(ngModel)]="description"
                  rows="2"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Optionale Beschreibung der Gruppe..."
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Organizations Section -->
          <div class="bg-white rounded-lg border border-gray-200 p-4 mt-4">
            <h2 i18n class="text-sm font-semibold text-gray-900 mb-4">
              Organisationen
            </h2>
            @if (organizations().length === 0) {
              <p i18n class="text-xs text-gray-500">Keine Organisationen vorhanden.</p>
            } @else {
              <div class="space-y-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    [checked]="allOrganizations()"
                    (change)="toggleAllOrganizations($event)"
                    class="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm font-medium text-gray-900" i18n>Alle Organisationen (*)</span>
                </label>

                @if (!allOrganizations()) {
                  <div class="space-y-1 pl-6 border-l border-gray-200 ml-2">
                    @for (org of organizations(); track org.id) {
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          [checked]="isOrganizationSelected(org.id)"
                          (change)="toggleOrganization(org.id, $event)"
                          class="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span class="text-sm text-gray-900">{{ org.name }}</span>
                      </label>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </app-admin-content>
    </div>
  `,
})
export class GroupNewComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly dataService = inject(GroupNewDataService);
  private readonly orgListDataService = inject(OrganizationListDataService);
  private readonly notifications = inject(NotificationService);

  readonly saving = signal(false);
  readonly organizations = signal<Organization[]>([]);
  readonly selectedOrgIds = signal<Set<string>>(new Set());
  readonly allOrganizations = signal(false);

  name = '';
  description = '';

  ngOnInit(): void {
    this.orgListDataService.getOrganizations().subscribe({
      next: (orgs) => this.organizations.set(orgs),
    });
  }

  isValid(): boolean {
    return this.name.trim().length > 0;
  }

  isOrganizationSelected(orgId: string): boolean {
    return this.selectedOrgIds().has(orgId);
  }

  toggleOrganization(orgId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedOrgIds.update((ids) => {
      const next = new Set(ids);
      if (checked) {
        next.add(orgId);
      } else {
        next.delete(orgId);
      }
      return next;
    });
  }

  toggleAllOrganizations(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.allOrganizations.set(checked);
    if (checked) {
      this.selectedOrgIds.set(new Set());
    }
  }

  private buildOrganizationsList(): string[] {
    if (this.allOrganizations()) {
      return ['*'];
    }
    return Array.from(this.selectedOrgIds()).map((id) => `organizations/${id}`);
  }

  save(): void {
    if (!this.isValid()) return;

    this.saving.set(true);
    this.dataService.createGroup({
      name: this.name.trim(),
      description: this.description.trim(),
      organizations: this.buildOrganizationsList(),
      permissions: [],
    }).subscribe({
      next: (group) => {
        this.router.navigate(['/admin/groups', group.id, 'edit']);
      },
      error: () => {
        this.notifications.error($localize`Fehler beim Erstellen der Gruppe`);
        this.saving.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/groups']);
  }
}
