// =============================================================================
// Notification — Platform notification types
// =============================================================================

export type NotificationKind = 'pick' | 'grade' | 'creator' | 'billing' | 'platform';

export interface Notification {
  id: string;
  kind: NotificationKind;
  title: string;
  sub: string;
  time: string;
  unread: boolean;
}
