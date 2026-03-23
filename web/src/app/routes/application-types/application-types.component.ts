import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  EmptyStateComponent,
} from '../../shared/components';

@Component({
  selector: 'app-application-types',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, EmptyStateComponent],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs" />

      <div class="flex-1 overflow-auto p-4">
        <div class="mx-auto w-full max-w-6xl">
          <app-empty-state
            title="Application Types coming soon"
            description="This area is currently a placeholder without functionality."
          />
        </div>
      </div>
    </div>
  `,
})
export class ApplicationTypesComponent {
  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Application Types' }];
}
