import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PageHeaderComponent, BreadcrumbItem } from '../page-header/page-header.component';

@Component({
  selector: 'app-page-content-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent],
  template: `
    <div class="flex h-full min-h-0 flex-col">
      <app-page-header class="h-[50px] shrink-0" [breadcrumbs]="breadcrumbs()" [title]="title()">
        <ng-content select="[layout-header-actions]" />
      </app-page-header>

      <div class="h-[calc(100%-50px)] min-h-0 overflow-auto">
        <div class="w-full min-h-full p-4">
          <ng-content select="[layout-content]" />
        </div>
      </div>
    </div>
  `,
})
export class PageContentLayoutComponent {
  readonly breadcrumbs = input<BreadcrumbItem[]>([]);
  readonly title = input<string>();
}
