import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
} from '../../../shared/components';
import { UserGroup } from '../../../shared/models';
import { GroupEditDataService } from './group-edit.data-service';

@Component({
  selector: 'app-group-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeaderComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs">
        <div class="flex gap-2">
          <app-button variant="secondary" (clicked)="cancel()">
            Abbrechen
          </app-button>
          <app-button
            variant="primary"
            [disabled]="saving() || !isValid()"
            (clicked)="save()"
          >
            {{ saving() ? 'Wird gespeichert...' : 'Speichern' }}
          </app-button>
        </div>
      </app-page-header>

      <div class="flex flex-1 justify-center overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" text="Gruppe wird geladen..." />
        } @else if (group()) {
          <div class="w-full max-w-3xl">
            <div class="bg-white rounded-lg border border-gray-200 p-4">
              <h2 class="text-sm font-semibold text-gray-900 mb-4">
                Gruppe bearbeiten
              </h2>
              <div class="space-y-3">
                <div>
                  <label
                    for="name"
                    class="block text-xs font-medium text-gray-500 mb-1"
                  >
                    Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    [(ngModel)]="name"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    for="description"
                    class="block text-xs font-medium text-gray-500 mb-1"
                  >
                    Beschreibung
                  </label>
                  <textarea
                    id="description"
                    [(ngModel)]="description"
                    rows="2"
                    class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class GroupEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dataService = inject(GroupEditDataService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly group = signal<UserGroup | null>(null);

  name = '';
  description = '';

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Gruppen', path: '/admin/groups' },
    { label: 'Bearbeiten' },
  ];

  private groupId = '';

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id') || '';
    if (this.groupId) {
      this.loadGroup();
    }
  }

  private loadGroup(): void {
    this.dataService.getGroup(this.groupId).subscribe({
      next: (group) => {
        this.group.set(group);
        this.name = group.name;
        this.description = group.description;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  isValid(): boolean {
    return this.name.trim().length > 0;
  }

  save(): void {
    if (!this.isValid()) return;

    this.saving.set(true);
    this.dataService.updateGroup(this.groupId, {
      name: this.name.trim(),
      description: this.description.trim(),
    }).subscribe({
      next: (updated) => {
        this.group.set(updated);
        this.saving.set(false);
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/groups']);
  }
}
