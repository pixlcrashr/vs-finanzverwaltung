import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-admin-content-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
  header {
    height: 37px;
  }
  `,
  template: `
    <header class="w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div class="flex h-full w-full items-center justify-between px-4 py-2">
        <div>
          @if (title()) {
            <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {{ title() }}
            </h2>
          }
        </div>

        <div class="flex items-center gap-2">
          <ng-content />
        </div>
      </div>
    </header>
  `,
})
export class AdminContentHeaderComponent {
  readonly title = input<string>();
}
