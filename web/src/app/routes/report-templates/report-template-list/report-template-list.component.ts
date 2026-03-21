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
import { formatDateShort } from '../../../shared/utils';
import { ReportTemplate } from '../../../shared/models';
import { ReportTemplateListDataService } from './report-template-list.data-service';

@Component({
  selector: 'app-report-template-list',
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
        <a
          routerLink="/report-templates/new"
          class="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:opacity-90"
        >
          Neue Vorlage
        </a>
      </app-page-header>

      <div class="flex flex-1 justify-center overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" text="Vorlagen werden geladen..." />
        } @else if (templates().length === 0) {
          <app-empty-state
            title="Keine Vorlagen vorhanden"
            description="Erstellen Sie Ihre erste Berichtsvorlage."
          >
            <a
              routerLink="/report-templates/new"
              class="px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:opacity-90"
            >
              Erste Vorlage erstellen
            </a>
          </app-empty-state>
        } @else {
          <div class="w-full max-w-6xl">
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
                        class="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-left text-gray-500"
                      >
                        Aktualisiert
                      </th>
                      <th scope="col" class="px-3 py-2 text-right">
                        <span class="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 bg-white">
                    @for (template of templates(); track template.id) {
                      <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-3 py-2 text-xs text-gray-900">{{ template.name }}</td>
                        <td class="px-3 py-2 text-xs text-gray-900">
                          <div class="max-w-md truncate" [title]="template.description || ''">
                            {{ template.description || '-' }}
                          </div>
                        </td>
                        <td class="px-3 py-2 text-xs text-gray-900">{{ formatDate(template.updatedAt) }}</td>
                        <td class="px-3 py-2 text-right text-xs">
                          <div class="flex items-center justify-end gap-2">
                            <a
                              [routerLink]="['/report-templates', template.id, 'edit']"
                              class="text-xs text-blue-600 hover:underline"
                            >
                              Bearbeiten
                            </a>
                            <button
                              type="button"
                              class="text-xs text-red-600 hover:underline"
                              (click)="openDeleteDialog(template)"
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
          Vorlage löschen
        </h2>
        <p class="text-xs text-gray-600 mb-4">
          Möchten Sie die Vorlage
          <span class="font-medium text-gray-900">"{{ templateToDelete()?.name }}"</span>
          wirklich löschen?
        </p>

        <div class="flex justify-end gap-2">
          <app-button variant="secondary" (clicked)="closeDialog()">Abbrechen</app-button>
          <app-button variant="danger" [loading]="deleting()" (clicked)="deleteTemplate()">
            Löschen
          </app-button>
        </div>
      </div>
    </ng-template>
  `,
})
export class ReportTemplateListComponent implements OnInit {
  private readonly dataService = inject(ReportTemplateListDataService);
  private readonly dialog = inject(Dialog);

  readonly deleteDialogTemplate = viewChild.required<TemplateRef<unknown>>('deleteDialogTemplate');

  readonly loading = signal(true);
  readonly deleting = signal(false);
  readonly templates = signal<ReportTemplate[]>([]);
  readonly templateToDelete = signal<ReportTemplate | null>(null);

  private dialogRef: ReturnType<typeof this.dialog.open> | null = null;

  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Berichtsvorlagen' }];

  ngOnInit(): void {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    this.dataService.getTemplates().subscribe({
      next: (templates) => {
        this.templates.set(templates);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  openDeleteDialog(template: ReportTemplate): void {
    this.templateToDelete.set(template);
    this.dialogRef = this.dialog.open(this.deleteDialogTemplate(), {
      panelClass: ['flex', 'items-center', 'justify-center'],
      backdropClass: 'bg-black/50',
    });
  }

  closeDialog(): void {
    this.dialogRef?.close();
    this.dialogRef = null;
    this.templateToDelete.set(null);
  }

  deleteTemplate(): void {
    const template = this.templateToDelete();
    if (!template) return;

    this.deleting.set(true);
    this.dataService.deleteTemplate(template.id).subscribe({
      next: () => {
        this.templates.update((templates) => templates.filter((t) => t.id !== template.id));
        this.deleting.set(false);
        this.closeDialog();
      },
      error: () => {
        this.deleting.set(false);
      },
    });
  }

  formatDate(date: Date): string {
    return formatDateShort(date);
  }
}
