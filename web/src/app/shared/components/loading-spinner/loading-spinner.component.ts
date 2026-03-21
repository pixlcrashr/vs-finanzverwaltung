import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export type SpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-loading-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center" [class]="containerClass()">
      <svg
        class="animate-spin text-blue-600"
        [class]="sizeClasses()"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      @if (text()) {
        <span class="ml-2 text-gray-500" [class]="textSizeClass()">
          {{ text() }}
        </span>
      }
    </div>
  `,
})
export class LoadingSpinnerComponent {
  readonly size = input<SpinnerSize>('md');
  readonly text = input<string>();
  readonly fullPage = input(false);

  containerClass(): string {
    if (this.fullPage()) {
      return 'min-h-[200px]';
    }
    return '';
  }

  sizeClasses(): string {
    const sizes: Record<SpinnerSize, string> = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-10 h-10',
    };
    return sizes[this.size()];
  }

  textSizeClass(): string {
    const sizes: Record<SpinnerSize, string> = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    };
    return sizes[this.size()];
  }
}
