import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  ButtonComponent,
  LoadingSpinnerComponent,
} from '../../../shared/components';
import {
  JournalImportDataService,
  ImportSourceOption,
  ImportResult,
  JournalImportType,
} from './journal-import.data-service';

@Component({
  selector: 'app-journal-import',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    PageHeaderComponent,
    ButtonComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs" />

      <div class="flex-1 overflow-auto p-4">
        @if (loading()) {
          <app-loading-spinner [fullPage]="true" text="Importquellen werden geladen..." />
        } @else {
          <div class="mx-auto w-full max-w-6xl space-y-3">
            @if (importResult()) {
              <!-- Import Result -->
              <div
                class="rounded-lg border p-4"
                [class.bg-green-50]="importResult()!.success"
                [class.border-green-200]="importResult()!.success"
                [class.bg-red-50]="!importResult()!.success"
                [class.border-red-200]="!importResult()!.success"
              >
                <h2 class="text-sm font-semibold mb-4" [class.text-green-800]="importResult()!.success" [class.text-red-800]="!importResult()!.success">
                  {{ importResult()!.success ? 'Import erfolgreich' : 'Import fehlgeschlagen' }}
                </h2>

                <dl class="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <dt class="text-xs text-gray-500">Importiert</dt>
                    <dd class="text-xl font-semibold text-green-600">{{ importResult()!.importedCount }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-gray-500">Übersprungen</dt>
                    <dd class="text-xl font-semibold text-yellow-600">{{ importResult()!.skippedCount }}</dd>
                  </div>
                </dl>

                @if (importResult()!.errors.length > 0) {
                  <div class="mt-4">
                    <p class="text-xs font-medium text-gray-700 mb-2">Hinweise:</p>
                    <ul class="text-xs text-gray-500 list-disc list-inside">
                      @for (error of importResult()!.errors; track error) {
                        <li>{{ error }}</li>
                      }
                    </ul>
                  </div>
                }

                <div class="flex gap-2 mt-4">
                  <app-button (clicked)="resetImport()">Neuer Import</app-button>
                  <a
                    routerLink="/journal"
                    class="px-2 py-1 text-xs font-medium text-gray-900 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Zum Journal
                  </a>
                </div>
              </div>
            } @else {
              <!-- Import Form -->
              <div class="bg-white rounded-lg border border-gray-200 p-4">
                <h2 class="text-sm font-semibold text-gray-900 mb-4">
                  Buchungen importieren
                </h2>

                <div class="space-y-3">
                  <div>
                    <label
                      for="type"
                      class="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Importtyp
                    </label>
                    <select
                      id="type"
                      [(ngModel)]="selectedType"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte wählen...</option>
                      <option value="lexware">Lexware Buchhaltung</option>
                      <option value="datev">DATEV Buchungsstapel</option>
                    </select>
                    @if (selectedType === 'lexware') {
                      <p class="mt-1 text-xs text-gray-500">
                        Das Lexware Journal muss als CSV mit Trennzeichen ";" exportiert sein.
                      </p>
                    }
                    @if (selectedType === 'datev') {
                      <p class="mt-1 text-xs text-gray-500">
                        Der DATEV Buchungsstapel muss als CSV im Standardformat vorliegen.
                      </p>
                    }
                  </div>

                  <div>
                    <label
                      for="source"
                      class="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Importquelle
                    </label>
                    <select
                      id="source"
                      [(ngModel)]="selectedSourceId"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte wählen...</option>
                      @for (source of sources(); track source.id) {
                        <option [value]="source.id">{{ source.name }}</option>
                      }
                    </select>
                  </div>

                  <div>
                    <label
                      for="file"
                      class="block text-xs font-medium text-gray-700 mb-1"
                    >
                      CSV-Datei
                    </label>
                    <input
                      id="file"
                      type="file"
                      accept=".csv"
                      (change)="onFileSelected($event)"
                      class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer"
                    />
                  </div>

                  @if (selectedFile()) {
                    <p class="text-xs text-gray-500">
                      Ausgewählte Datei: {{ selectedFile()!.name }}
                    </p>
                  }
                </div>

                <div class="flex justify-end gap-2 mt-4">
                  <a
                    routerLink="/journal"
                    class="px-2 py-1 text-xs font-medium text-gray-900 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Abbrechen
                  </a>
                  <app-button
                    [disabled]="!canImport()"
                    [loading]="importing()"
                    (clicked)="startImport()"
                  >
                    Importieren
                  </app-button>
                </div>
              </div>

              <!-- Help Text -->
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 class="text-xs font-medium text-blue-800 mb-2">Hinweise zum Import</h3>
                <ul class="text-xs text-blue-700 list-disc list-inside space-y-1">
                  <li>Die CSV-Datei muss im Format der ausgewählten Importquelle vorliegen</li>
                  <li>Bereits importierte Buchungen werden automatisch erkannt und übersprungen</li>
                  <li>Der Import kann nicht rückgängig gemacht werden</li>
                </ul>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class JournalImportComponent implements OnInit {
  private readonly dataService = inject(JournalImportDataService);

  readonly loading = signal(true);
  readonly importing = signal(false);
  readonly sources = signal<ImportSourceOption[]>([]);
  readonly selectedFile = signal<File | null>(null);
  readonly importResult = signal<ImportResult | null>(null);

  selectedType: '' | JournalImportType = '';
  selectedSourceId = '';

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Journal', path: '/journal' },
    { label: 'Import' },
  ];

  ngOnInit(): void {
    this.loadSources();
  }

  private loadSources(): void {
    this.dataService.getImportSources().subscribe({
      next: (sources) => {
        this.sources.set(sources);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  canImport(): boolean {
    return !!this.selectedType && !!this.selectedSourceId && !!this.selectedFile();
  }

  startImport(): void {
    if (!this.canImport()) return;

    this.importing.set(true);

    this.dataService.importFile(
      this.selectedSourceId,
      this.selectedType as JournalImportType,
      this.selectedFile()!,
    ).subscribe({
      next: (result) => {
        this.importing.set(false);
        this.importResult.set(result);
      },
      error: () => {
        this.importing.set(false);
        this.importResult.set({
          success: false,
          importedCount: 0,
          skippedCount: 0,
          errors: ['Ein unerwarteter Fehler ist aufgetreten'],
        });
      },
    });
  }

  resetImport(): void {
    this.importResult.set(null);
    this.selectedFile.set(null);
    this.selectedType = '';
    this.selectedSourceId = '';
  }
}
