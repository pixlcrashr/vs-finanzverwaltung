import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styles: `
  header {
    height: 50px;
  }
  `,
  template: `
    <header class="w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div class="flex h-full w-full items-center justify-between px-4 py-2 sm:px-6">
        <div>
          <!-- Breadcrumb -->
          <nav aria-label="Breadcrumb">
            <ol class="flex items-center space-x-1.5 text-xs">
              @for (item of breadcrumbs(); track item.label; let last = $last) {
                <li class="flex items-center">
                  @if (!last) {
                    @if (item.path) {
                      <a [routerLink]="item.path" class="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                        {{ item.label }}
                      </a>
                    } @else {
                      <span class="font-medium text-gray-900 dark:text-gray-100">
                        {{ item.label }}
                      </span>
                    }
                    <svg
                      class="w-3 h-3 mx-1.5 text-gray-400 dark:text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  } @else {
                    <span class="font-medium text-gray-900 dark:text-gray-100">
                      {{ item.label }}
                    </span>
                  }
                </li>
              }
            </ol>
          </nav>

          <!-- Title -->
          @if (title()) {
            <h1 class="mt-0.5 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ title() }}
            </h1>
          }
        </div>

        <!-- Actions slot -->
        <div class="flex items-center gap-2">
          <ng-content />
        </div>
      </div>
    </header>
  `,
})
export class PageHeaderComponent {
  readonly breadcrumbs = input<BreadcrumbItem[]>([]);
  readonly title = input<string>();
}
