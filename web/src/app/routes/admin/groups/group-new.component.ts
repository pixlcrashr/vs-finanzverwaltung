import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  NotificationService,
} from '../../../shared/components';
import { GroupNewDataService } from './group-new.data-service';

@Component({
  selector: 'app-group-new',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeaderComponent,
    ButtonComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs">
        <div class="flex gap-2">
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
        </div>
      </app-page-header>

      <div class="flex flex-1 justify-center overflow-auto p-4">
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
        </div>
      </div>
    </div>
  `,
})
export class GroupNewComponent {
  private readonly router = inject(Router);
  private readonly dataService = inject(GroupNewDataService);
  private readonly notifications = inject(NotificationService);

  readonly saving = signal(false);

  name = '';
  description = '';

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: $localize`Gruppen`, path: '/admin/groups' },
    { label: $localize`Neu` },
  ];

  isValid(): boolean {
    return this.name.trim().length > 0;
  }

  save(): void {
    if (!this.isValid()) return;

    this.saving.set(true);
    this.dataService.createGroup({
      name: this.name.trim(),
      description: this.description.trim(),
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
