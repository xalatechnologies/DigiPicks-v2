# Account — Settings

Stitch reference for the subscriber **Settings** page (`/account/settings`).

| File         | Role                                                        |
| ------------ | ----------------------------------------------------------- |
| `screen.png` | Visual target — profile, triggers, personalization, sidebar |
| `code.html`  | Structure, copy, panels                                     |
| `DESIGN.md`  | Editorial system notes (map to existing tokens only)        |

## Implementation

- **Route:** `apps/web/src/account/pages/AccountSettings.tsx`
- **DS:** `AccountSettingsPanel`, `AccountProfileSettingsCard`, `AccountNotificationTriggerRow`, `AccountSettingsActionRow`, `AccountBillingPanel`, `AccountSidebarPanel`
- **Data:** `api.users.updateProfile`, `api.notify.updatePrefs`, `api.subscriptions.mySubscriptions`, `api.gdpr.exportMyData`
