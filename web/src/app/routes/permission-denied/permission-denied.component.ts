import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  PageContentLayoutComponent,
  BreadcrumbItem,
} from '../../shared/components';

@Component({
  selector: 'app-permission-denied',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageContentLayoutComponent],
  template: `
    <app-page-content-layout [breadcrumbs]="breadcrumbs">
      <div layout-content class="flex flex-1 justify-center">
        <div class="flex flex-col items-center justify-center py-20">
          <svg class="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h1 i18n class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Zugriff verweigert
          </h1>
          <p i18n class="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            Sie haben nicht die erforderlichen Berechtigungen, um diese Seite aufzurufen.
          </p>
        </div>
      </div>
    </app-page-content-layout>
  `,
})
export class PermissionDeniedComponent {
  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: $localize`Zugriff verweigert` },
  ];
}
