import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  EmptyStateComponent,
} from '../../shared/components';

@Component({
  selector: 'app-applications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, EmptyStateComponent],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs" />

      <div class="flex-1 overflow-auto p-4">
        <div class="mx-auto w-full max-w-6xl">
          <app-empty-state
            title="Applications coming soon"
            description="This area is being prepared and currently serves as a placeholder."
          />
        </div>
      </div>
    </div>
  `,
})
export class ApplicationsComponent {
  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Applications' }];
}
