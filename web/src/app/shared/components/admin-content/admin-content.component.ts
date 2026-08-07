import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-admin-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      height: calc(100% - 37px);
      min-height: 0;
      overflow: auto;
    }
  `,
  template: `
    <div class="flex w-full min-h-full justify-center p-4">
      <ng-content />
    </div>
  `,
})
export class AdminContentComponent {}
