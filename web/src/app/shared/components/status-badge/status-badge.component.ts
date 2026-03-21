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
  readonly size = input<'sm' | 'md'>('md');

  readonly badgeClasses = computed(() => {
    const sizeClasses = this.size() === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : 'px-2.5 py-0.5 text-xs';

    const base = `inline-flex items-center rounded-full font-medium ${sizeClasses}`;

    // High contrast colors with borders for better readability
    const variants: Record<BadgeVariant, string> = {
      success: 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300 dark:border-emerald-700',
      danger: 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
      warning: 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700',
      info: 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700',
      neutral: 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
    };

    return `${base} ${variants[this.variant()]}`;
  });
}
