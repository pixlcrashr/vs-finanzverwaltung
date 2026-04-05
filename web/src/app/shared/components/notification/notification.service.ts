import { Injectable, inject } from '@angular/core';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { Overlay, GlobalPositionStrategy } from '@angular/cdk/overlay';
import { NotificationComponent } from './notification.component';
import {
  NotificationConfig,
  NotificationData,
  NotificationPosition,
  DEFAULT_NOTIFICATION_CONFIG,
} from './notification.types';

/**
 * Reference to an open notification, allowing programmatic control.
 */
export interface NotificationRef {
  /** Close the notification */
  dismiss: () => void;
  /** Promise that resolves when the notification is closed */
  afterDismissed: () => Promise<void>;
}

/**
 * Service for displaying notifications using CDK Overlay.
 * Similar to Angular Material's MatSnackBar API.
 *
 * @example
 * ```typescript
 * // Simple notification
 * this.notificationService.success('Changes saved successfully');
 *
 * // With title and options
 * this.notificationService.show({
 *   title: 'Success',
 *   message: 'Your changes have been saved',
 *   type: 'success',
 *   position: 'bottom-right',
 *   duration: 3000,
 * });
 *
 * // With action buttons
 * this.notificationService.show({
 *   message: 'Item deleted',
 *   type: 'info',
 *   actions: [
 *     { label: 'Undo', onClick: () => this.undoDelete() }
 *   ]
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);

  private activeNotifications: Map<NotificationPosition, DialogRef<unknown, NotificationComponent>[]> = new Map();

  /**
   * Show a notification with full configuration options.
   */
  show(config: NotificationConfig): NotificationRef {
    const data: NotificationData = {
      message: config.message,
      title: config.title ?? DEFAULT_NOTIFICATION_CONFIG.title,
      type: config.type ?? DEFAULT_NOTIFICATION_CONFIG.type,
      duration: config.duration ?? DEFAULT_NOTIFICATION_CONFIG.duration,
      position: config.position ?? DEFAULT_NOTIFICATION_CONFIG.position,
      dismissible: config.dismissible ?? DEFAULT_NOTIFICATION_CONFIG.dismissible,
      actions: config.actions ?? DEFAULT_NOTIFICATION_CONFIG.actions,
    };

    const positionStrategy = this.createPositionStrategy(data.position);

    const dialogRef = this.dialog.open(NotificationComponent, {
      data,
      hasBackdrop: false,
      panelClass: this.getPanelClasses(data.position),
      positionStrategy,
      disableClose: true,
    });

    // Track active notifications for stacking
    this.trackNotification(data.position, dialogRef);

    dialogRef.closed.subscribe(() => {
      this.untrackNotification(data.position, dialogRef);
    });

    return {
      dismiss: () => dialogRef.close(),
      afterDismissed: () =>
        new Promise<void>((resolve) => {
          dialogRef.closed.subscribe(() => resolve());
        }),
    };
  }

  /**
   * Show a success notification.
   */
  success(message: string, config?: Partial<NotificationConfig>): NotificationRef {
    return this.show({ ...config, message, type: 'success' });
  }

  /**
   * Show an error notification.
   */
  error(message: string, config?: Partial<NotificationConfig>): NotificationRef {
    return this.show({ ...config, message, type: 'error' });
  }

  /**
   * Show a warning notification.
   */
  warning(message: string, config?: Partial<NotificationConfig>): NotificationRef {
    return this.show({ ...config, message, type: 'warning' });
  }

  /**
   * Show an info notification.
   */
  info(message: string, config?: Partial<NotificationConfig>): NotificationRef {
    return this.show({ ...config, message, type: 'info' });
  }

  /**
   * Dismiss all active notifications.
   */
  dismissAll(): void {
    this.activeNotifications.forEach((notifications) => {
      notifications.forEach((ref) => ref.close());
    });
  }

  private createPositionStrategy(position: NotificationPosition): GlobalPositionStrategy {
    const strategy = this.overlay.position().global();
    const margin = '16px';

    switch (position) {
      case 'top-left':
        return strategy.top(margin).left(margin);
      case 'top-center':
        return strategy.top(margin).centerHorizontally();
      case 'top-right':
        return strategy.top(margin).right(margin);
      case 'bottom-left':
        return strategy.bottom(margin).left(margin);
      case 'bottom-center':
        return strategy.bottom(margin).centerHorizontally();
      case 'bottom-right':
        return strategy.bottom(margin).right(margin);
    }
  }

  private getPanelClasses(position: NotificationPosition): string[] {
    const classes = ['notification-panel'];

    // Add animation direction classes
    if (position.startsWith('top')) {
      classes.push('notification-from-top');
    } else {
      classes.push('notification-from-bottom');
    }

    // Add stacking class based on position
    classes.push(`notification-position-${position}`);

    return classes;
  }

  private trackNotification(
    position: NotificationPosition,
    ref: DialogRef<unknown, NotificationComponent>
  ): void {
    const notifications = this.activeNotifications.get(position) ?? [];
    notifications.push(ref);
    this.activeNotifications.set(position, notifications);
    this.updateStackPositions(position);
  }

  private untrackNotification(
    position: NotificationPosition,
    ref: DialogRef<unknown, NotificationComponent>
  ): void {
    const notifications = this.activeNotifications.get(position) ?? [];
    const index = notifications.indexOf(ref);
    if (index > -1) {
      notifications.splice(index, 1);
      this.activeNotifications.set(position, notifications);
      this.updateStackPositions(position);
    }
  }

  private updateStackPositions(position: NotificationPosition): void {
    const notifications = this.activeNotifications.get(position) ?? [];
    const isTop = position.startsWith('top');
    const gap = 8; // Gap between stacked notifications
    const baseOffset = 16; // Base margin from edge

    notifications.forEach((ref, index) => {
      const element = ref.overlayRef?.overlayElement;
      if (element) {
        // Calculate offset based on index and previous notification heights
        let offset = baseOffset;
        for (let i = 0; i < index; i++) {
          const prevElement = notifications[i].overlayRef?.overlayElement;
          if (prevElement) {
            offset += prevElement.offsetHeight + gap;
          }
        }

        if (isTop) {
          element.style.top = `${offset}px`;
        } else {
          element.style.bottom = `${offset}px`;
        }
      }
    });
  }
}
