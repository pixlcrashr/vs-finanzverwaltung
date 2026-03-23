import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="badgeClasses()">
      <ng-content />
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly variant = input<BadgeVariant>('neutral');

  readonly badgeClasses = computed(() => {
    const base = `inline-flex items-center rounded-md px-2 py-1 text-xs font-medium inset-ring`;

    // High contrast colors with borders for better readability
    const variants: Record<BadgeVariant, string> = {
      success: 'bg-green-400/10 text-green-600 inset-ring-green-600/20',
      danger: 'bg-red-400/10 text-red-600 inset-ring-red-600/20',
      warning: 'bg-yellow-400/10 text-yellow-600 inset-ring-yellow-600/20',
      info: 'bg-blue-400/10 text-blue-600 inset-ring-blue-600/30',
      neutral: 'bg-gray-400/10 text-gray-600 inset-ring-gray-600/20',
    };

    return `${base} ${variants[this.variant()]}`;
  });
}
