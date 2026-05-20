# Account — Notifications

Stitch reference for the subscriber **Notifications** inbox (`/account/notifications`).

| File         | Role                                                     |
| ------------ | -------------------------------------------------------- |
| `screen.png` | Visual target — filter pills, inbox cards, alert sidebar |
| `code.html`  | Structure, copy, channel controls, engagement chart      |
| `DESIGN.md`  | Editorial system notes (map to existing tokens only)     |

## Implementation

- **Route:** `apps/web/src/account/pages/Notifications.tsx`
- **DS:** `NotificationInboxCard`, `AccountNotificationSidebar`, `StudioFilterPills`
- **Data:** `api.notifications.listMine`, `markRead`, `markAllRead`, `api.users.meSafe` (prefs)
