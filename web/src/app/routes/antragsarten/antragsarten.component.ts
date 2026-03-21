import { Component, ChangeDetectionStrategy } from '@angular/core';
import {
  PageHeaderComponent,
  BreadcrumbItem,
  EmptyStateComponent,
} from '../../shared/components';

@Component({
  selector: 'app-antragsarten',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, EmptyStateComponent],
  template: `
    <div class="flex flex-col h-full">
      <app-page-header [breadcrumbs]="breadcrumbs" />

      <div class="flex-1 overflow-auto p-4">
        <div class="mx-auto w-full max-w-6xl">
          <app-empty-state
            title="Antragsarten folgen"
            description="Dieser Bereich ist aktuell ein Platzhalter ohne Funktion."
          />
        </div>
      </div>
    </div>
  `,
})
export class AntragsartenComponent {
  readonly breadcrumbs: BreadcrumbItem[] = [{ label: 'Antragsarten' }];
}
