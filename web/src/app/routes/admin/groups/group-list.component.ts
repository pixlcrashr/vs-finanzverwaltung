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
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
  EmptyStateComponent,
} from '../../../shared/components';
import { UserGroup } from '../../../shared/models';
import { GroupListDataService } from './group-list.data-service';

@Component({
  selector: 'app-group-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    DialogModule,
    PageHeaderComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs">
        <a routerLink="/admin/groups/new">
          <app-button variant="primary">
            Neue Gruppe
          </app-button>
        </a>
      </app-page-header>

      <div class="flex flex-1 justify-center overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" text="Gruppen werden geladen..." />
        } @else if (groups().length === 0) {
          <app-empty-state
            title="Keine Gruppen vorhanden"
            description="Erstellen Sie eine neue Gruppe, um Benutzerberechtigungen zu verwalten."
          >
            <a routerLink="/admin/groups/new">
              <app-button variant="primary">
                Erste Gruppe erstellen
              </app-button>
            </a>
          </app-empty-state>
        } @else {
          <div class="w-full max-w-4xl">
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
                      <th scope="col" class="px-3 py-2 text-right">
                        <span class="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    @for (group of groups(); track group.id) {
                      <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-3 py-2 text-xs text-gray-900">{{ group.name }}</td>
                        <td class="px-3 py-2 text-xs text-gray-900">
                          <div class="max-w-md truncate" [title]="group.description || ''">
                            {{ group.description || '-' }}
                          </div>
                        </td>
                        <td class="px-3 py-2 text-right text-xs">
                          <div class="flex items-center justify-end gap-2">
                            <a
                              [routerLink]="['/admin/groups', group.id, 'edit']"
                              class="text-xs text-blue-600 hover:underline"
                            >
                              Bearbeiten
                            </a>
                            <button
                              type="button"
                              class="text-xs text-red-600 hover:underline"
                              (click)="openDeleteDialog(group)"
                            >
                              Löschen
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

    <ng-template #deleteDialogTemplate>
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-2">
          Gruppe löschen
        </h2>
        <p class="text-xs text-gray-600 mb-4">
          Möchten Sie die Gruppe
          <span class="font-medium text-gray-900">"{{ groupToDelete()?.name }}"</span>
          wirklich löschen?
        </p>

        <div class="flex justify-end gap-2">
          <app-button variant="secondary" (clicked)="closeDialog()">Abbrechen</app-button>
          <app-button variant="danger" [loading]="deleting() !== null" (clicked)="deleteGroup()">
            Löschen
          </app-button>
        </div>
      </div>
    </ng-template>
  `,
})
export class GroupListComponent implements OnInit {
  private readonly dataService = inject(GroupListDataService);
  private readonly dialog = inject(Dialog);

  readonly deleteDialogTemplate = viewChild.required<TemplateRef<unknown>>('deleteDialogTemplate');

  readonly loading = signal(true);
  readonly deleting = signal<string | null>(null);
  readonly groups = signal<UserGroup[]>([]);
  readonly groupToDelete = signal<UserGroup | null>(null);

  private dialogRef: ReturnType<typeof this.dialog.open> | null = null;

  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Gruppen' }];

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

  openDeleteDialog(group: UserGroup): void {
    this.groupToDelete.set(group);
    this.dialogRef = this.dialog.open(this.deleteDialogTemplate(), {
      panelClass: ['flex', 'items-center', 'justify-center'],
      backdropClass: 'bg-black/50',
    });
  }

  closeDialog(): void {
    this.dialogRef?.close();
    this.dialogRef = null;
    this.groupToDelete.set(null);
  }

  deleteGroup(): void {
    const group = this.groupToDelete();
    if (!group) return;

    this.deleting.set(group.id);
    this.dataService.deleteGroup(group.id).subscribe({
      next: () => {
        this.groups.update((groups) => groups.filter((g) => g.id !== group.id));
        this.deleting.set(null);
        this.closeDialog();
      },
      error: () => {
        this.deleting.set(null);
      },
    });
  }
}
