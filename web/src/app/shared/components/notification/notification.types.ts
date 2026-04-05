/**
 * Notification position options
 */
export type NotificationPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Notification type variants
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Action button configuration for notifications
 */
export interface NotificationAction {
  label: string;
  onClick: () => void;
}

/**
 * Configuration options for displaying a notification
 */
export interface NotificationConfig {
  /** The main message to display */
  message: string;
  /** Optional title/heading */
  title?: string;
  /** Notification type affecting icon and colors */
  type?: NotificationType;
  /** Duration in milliseconds before auto-dismiss (0 = no auto-dismiss) */
  duration?: number;
  /** Position on screen */
  position?: NotificationPosition;
  /** Whether to show dismiss button */
  dismissible?: boolean;
  /** Optional action buttons */
  actions?: NotificationAction[];
}

/**
 * Internal notification data passed to the component
 */
export interface NotificationData extends Required<Omit<NotificationConfig, 'actions'>> {
  actions: NotificationAction[];
}

/**
 * Default configuration values
 */
export const DEFAULT_NOTIFICATION_CONFIG: Omit<NotificationData, 'message'> = {
  title: '',
  type: 'info',
  duration: 5000,
  position: 'bottom-center',
  dismissible: true,
  actions: [],
};
