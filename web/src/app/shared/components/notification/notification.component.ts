import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  NotificationData,
  NotificationType,
  NotificationAction,
} from './notification.types';

/**
 * Notification component displayed via CDK Overlay.
 * Styled after Tailwind UI notification patterns with support for
 * success, error, warning, and info variants.
 */
@Component({
  selector: 'app-notification',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [class]="containerClasses()"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div class="p-4">
        <div class="flex">
          <!-- Icon and Content -->
          <div class="flex items-start flex-1">
            <!-- Icon -->
            <div class="shrink-0">
              @switch (data.type) {
                @case ('success') {
                  <svg
                    class="h-6 w-6 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                @case ('error') {
                  <svg
                    class="h-6 w-6 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  </svg>
                }
                @case ('warning') {
                  <svg
                    class="h-6 w-6 text-yellow-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  </svg>
                }
                @case ('info') {
                  <svg
                    class="h-6 w-6 text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                    />
                  </svg>
                }
              }
            </div>

            <!-- Content -->
            <div class="ml-3 flex-1">
              @if (data.title) {
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ data.title }}
                </p>
              }
              <p
                [class]="
                  data.title
                    ? 'mt-1 text-sm text-gray-500 dark:text-gray-400'
                    : 'text-sm font-medium text-gray-900 dark:text-gray-100'
                "
              >
                {{ data.message }}
              </p>

              <!-- Actions -->
              @if (data.actions.length > 0) {
                <div class="mt-3 flex gap-3">
                  @for (action of data.actions; track action.label; let i = $index) {
                    <button
                      type="button"
                      [class]="actionButtonClasses(i)"
                      (click)="handleAction(action)"
                    >
                      {{ action.label }}
                    </button>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Dismiss button (separate column) -->
          @if (data.dismissible) {
            <div class="ml-4 shrink-0">
              <button
                type="button"
                class="inline-flex cursor-pointer rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                (click)="dismiss()"
              >
                <span class="sr-only">{{ dismissLabel }}</span>
                <svg
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"
                  />
                </svg>
              </button>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class NotificationComponent implements OnInit, OnDestroy {
  private readonly dialogRef = inject(DialogRef);
  readonly data = inject<NotificationData>(DIALOG_DATA);

  private autoCloseTimer: ReturnType<typeof setTimeout> | null = null;

  readonly dismissLabel = $localize`Schließen`;

  readonly visible = signal(true);

  readonly containerClasses = computed(() => {
    const base =
      'pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5 dark:ring-white/10';
    return base;
  });

  ngOnInit(): void {
    if (this.data.duration > 0) {
      this.autoCloseTimer = setTimeout(() => {
        this.dismiss();
      }, this.data.duration);
    }
  }

  ngOnDestroy(): void {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
    }
  }

  actionButtonClasses(index: number): string {
    if (index === 0) {
      return 'rounded-md bg-white dark:bg-gray-800 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800';
    }
    return 'rounded-md bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800';
  }

  handleAction(action: NotificationAction): void {
    action.onClick();
    this.dismiss();
  }

  dismiss(): void {
    this.visible.set(false);
    this.dialogRef.close();
  }
}
