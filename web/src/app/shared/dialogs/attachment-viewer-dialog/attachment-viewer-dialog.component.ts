import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ButtonComponent } from '../../components';
import { Attachment } from '../../models';

export interface AttachmentViewerDialogData {
  attachments: Attachment[];
  initialIndex?: number;
}

@Component({
  selector: 'app-attachment-viewer-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {{ currentAttachment()?.fileName }}
          </h2>
          @if (attachments.length > 1) {
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ currentIndex() + 1 }} / {{ attachments.length }}
            </span>
          }
        </div>
        <div class="flex items-center gap-2">
          <app-button variant="secondary" size="sm" (clicked)="download()">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <ng-container i18n>Herunterladen</ng-container>
          </app-button>
          <button
            type="button"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            (click)="close()"
            i18n-aria-label
            aria-label="Schließen"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100 dark:bg-gray-900 min-h-96">
        @if (loading()) {
          <div class="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
            <svg class="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span i18n>Wird geladen...</span>
          </div>
        } @else if (error()) {
          <div class="flex flex-col items-center gap-2 text-red-500 dark:text-red-400">
            <svg class="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span i18n>Fehler beim Laden der Datei</span>
          </div>
        } @else if (isImage()) {
          <img
            [src]="previewUrl()"
            [alt]="currentAttachment()?.fileName"
            class="max-w-full max-h-full object-contain"
            (error)="onImageError()"
          />
        } @else if (isPdf()) {
          <iframe
            [src]="previewUrl()"
            class="w-full h-full min-h-96"
            [title]="currentAttachment()?.fileName"
          ></iframe>
        } @else {
          <div class="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
            <svg class="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p i18n>Vorschau nicht verfügbar</p>
            <app-button (clicked)="download()">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <ng-container i18n>Datei herunterladen</ng-container>
            </app-button>
          </div>
        }
      </div>

      <!-- Footer with metadata and navigation -->
      <div class="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
        <div class="text-xs text-gray-500 dark:text-gray-400">
          <span>{{ formatFileSize(currentAttachment()?.fileSize ?? 0) }}</span>
          <span class="mx-2">·</span>
          <span>{{ formatDate(currentAttachment()?.uploadedAt) }}</span>
        </div>

        @if (attachments.length > 1) {
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="currentIndex() === 0"
              (click)="previous()"
              i18n-aria-label
              aria-label="Vorheriges Bild"
            >
              <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="currentIndex() === attachments.length - 1"
              (click)="next()"
              i18n-aria-label
              aria-label="Nächstes Bild"
            >
              <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class AttachmentViewerDialogComponent implements OnInit {
  private readonly dialogRef = inject(DialogRef);
  private readonly data = inject<AttachmentViewerDialogData>(DIALOG_DATA);

  readonly attachments: Attachment[] = this.data.attachments;
  readonly currentIndex = signal(this.data.initialIndex ?? 0);
  readonly loading = signal(true);
  readonly error = signal(false);

  readonly currentAttachment = computed(() => {
    if (this.attachments.length <= 0) {
      return null;
    }

    return this.attachments[this.currentIndex()];
  });

  readonly previewUrl = computed(() => {
    const attachment = this.currentAttachment();
    if (!attachment) return '';
    // In a real app, this would be constructed from the API base URL + storage key
    // For mock purposes, we'll use a placeholder or data URL
    return `/api/attachments/${attachment.storageKey}`;
  });

  readonly isImage = computed(() => {
    const mimeType = this.currentAttachment()?.mimeType ?? '';
    return mimeType.startsWith('image/');
  });

  readonly isPdf = computed(() => {
    const mimeType = this.currentAttachment()?.mimeType ?? '';
    return mimeType === 'application/pdf';
  });

  ngOnInit(): void {
    // Simulate loading the attachment
    setTimeout(() => {
      this.loading.set(false);
    }, 500);
  }

  previous(): void {
    if (this.currentIndex() > 0) {
      this.loading.set(true);
      this.error.set(false);
      this.currentIndex.update((i) => i - 1);
      setTimeout(() => this.loading.set(false), 300);
    }
  }

  next(): void {
    if (this.currentIndex() < this.attachments.length - 1) {
      this.loading.set(true);
      this.error.set(false);
      this.currentIndex.update((i) => i + 1);
      setTimeout(() => this.loading.set(false), 300);
    }
  }

  onImageError(): void {
    this.error.set(true);
  }

  download(): void {
    const attachment = this.currentAttachment();
    if (!attachment) return;

    // In a real app, this would trigger a download from the API
    const link = document.createElement('a');
    link.href = `/api/attachments/${attachment.storageKey}/download`;
    link.download = attachment.fileName;
    link.click();
  }

  close(): void {
    this.dialogRef.close();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }
}
