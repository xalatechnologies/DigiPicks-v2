# Stitch zip index (72–92)

Single source mapping **zip number → archive slug → route → build status**.

| Zip | Screen                       | Slug                          | Route                               | Status                        |
| --- | ---------------------------- | ----------------------------- | ----------------------------------- | ----------------------------- |
| 72  | Admin Dashboard Overview     | `admin-overview`              | `/admin`                            | Shipped (partial KPIs)        |
| 73  | Creator Applications         | `admin-applications`          | `/admin/applications`               | Shipped                       |
| 74  | Creators Management          | `admin-creators`              | `/admin/creators`                   | Shipped                       |
| 75  | Users Management             | `admin-users`                 | `/admin/users`                      | Shipped                       |
| 76  | Content Moderation           | `admin-moderation`            | `/admin/moderation`                 | Shipped (hub)                 |
| 77  | Subscriptions & Billing      | `admin-billing`               | `/admin/billing`                    | Shipped                       |
| 78  | Payouts & Finance            | `admin-payouts`               | `/admin/payouts`                    | Shipped (Connect status)      |
| 79  | Notifications & Campaigns    | `admin-campaigns`             | `/admin/campaigns`                  | Shipped (schema; composer v2) |
| 80  | Support & Disputes           | `admin-support`               | `/admin/support`                    | Shipped (hub)                 |
| 81  | Analytics & Platform Health  | `admin-analytics`             | `/admin/analytics`                  | Shipped                       |
| 82  | System Settings              | `admin-settings`              | `/admin/settings`                   | Shipped (read-only)           |
| 83  | Audit Logs                   | `admin-audit`                 | `/admin/audit`                      | Shipped (partial)             |
| 84  | Checkout summary             | `subscriber-checkout`         | `/creators/:handle/checkout`        | Shipped                       |
| 85  | Subscription confirmed       | `subscription-confirmed`      | `/creators/:handle/subscribed`      | Shipped                       |
| 86  | Payment methods              | `subscriber-payment-methods`  | `/account/payment-methods`          | Shipped                       |
| 87  | Billing history              | `subscriber-billing-history`  | `/account/billing-history`          | Shipped                       |
| 88  | Payment issue                | `subscriber-payment-issue`    | `/account/billing/payment-issue`    | Shipped                       |
| 89  | Creator payout onboarding    | `creator-payout-onboarding`   | `/dashboard/earnings/onboarding`    | Shipped                       |
| 90  | Refunds & disputes (finance) | `admin-refunds-disputes`      | `/admin/refunds`                    | Shipped                       |
| 91  | Creator access & permissions | `creator-access-permissions`  | `/dashboard/access`                 | Shipped                       |
| 92  | Entitlement inspector        | `admin-entitlement-inspector` | `/admin/users/:userId/entitlements` | Shipped                       |
| 93  | My Feed                      | `account-my-feed`             | `/account/feed`                     | Shipped                       |

**Note:** Pick-grade disputes live at `/admin/disputes` (existing). Billing refund cases are `/admin/refunds` (zip 90). Subscriber Copilot removed from account nav; `/account/copilot` redirects to `/account/feed`.
