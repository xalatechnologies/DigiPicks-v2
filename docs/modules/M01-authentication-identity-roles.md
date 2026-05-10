# M01 — Authentication, Identity & Roles

## Purpose

Single source of truth for who a user is and what they can do. Backs every
mutation gate on the platform — every other module depends on this one. Owns
sign-up, sign-in, session lifecycle, role assignment, and TOTP MFA for
sensitive roles.

## Target Roles

Visitor · Customer · Creator · Admin · Support · System

## Core Features

- Email + password registration via Convex Auth
- Discord OAuth as a secondary identity
- Role assignment (`user`, `creator`, `moderator`, `admin`, `tenant_admin`, `super_admin`)
- TOTP-based MFA enrollment with single-use recovery codes
- 15-minute MFA freshness gate on sensitive mutations
- Locale on the user record (`en` / `nb`) — drives i18n
- httpOnly + sameSite session cookies (Convex Auth defaults)

## User Stories

- As a visitor, I want to register with email + password so I can subscribe to creators.
- As a creator, I want to log in and reach my creator dashboard with a single redirect.
- As an admin, I want MFA required so platform-level actions are protected.
- As a user, I want to link my Discord identity so creator-side communities can recognise me.
- As a creator, I want recovery codes at MFA setup so I can recover after losing my device.

## Backend / Convex Build

**Tables**

- `users` (extended Convex Auth users — adds role, locale, creatorId, mfa fields, telegramChatId, notifyPrefs, discordId)
- `authAccounts`, `authSessions`, `authRefreshTokens`, `authVerificationCodes`, `authVerifiers`, `authRateLimits` (managed by `@convex-dev/auth`)

**Queries**

- `users.me` — auth-required current user
- `users.meSafe` — public; null when anonymous
- `mfa.status` — enrollment + freshness state for the Security panel

**Mutations**

- `users.updateProfile` — name, locale
- `users._setStripeCustomerId` (internal)
- `mfa.disable` — requires fresh code
- `applications.review` — flips `users.creatorId` + role on approval

**Actions**

- `mfa.enrollStart` — generates TOTP secret + 10 recovery codes + otpauth:// URI
- `mfa.verifySetup` — confirms enrollment with a fresh 6-digit code
- `mfa.verify` — refreshes `mfaLastVerifiedAt`; consumes recovery codes when used

## Frontend Build

**Pages**

- `apps/web/src/pages/Auth.tsx` — sign-in / register
- `apps/web/src/dashboard/pages/Settings.tsx` — Security panel hosts the MFA card
- `apps/web/src/auth/AuthGate.tsx` — role-aware route guard

**Components**

- `AuthLayout`, `AuthCard`, `AuthMethodButton`, `PasswordInput` (DS forms)
- `MfaEnrollmentCard` (DS surface — three-state machine)
- `RoleSwitcher` (DS nav)

## Testing

**Unit**

- TOTP HMAC-SHA1 verification across ±1 step drift
- Role helper guards (`requireUser`, `requireAdmin`, `requireCreatorOwnership`)
- Recovery code consumption (single-use)

**Integration**

- Application approval → `users.role` and `users.creatorId` patched atomically
- MFA `enrollStart` → `verifySetup` → `verify` round-trip refreshes `mfaLastVerifiedAt`
- `disable` rejects when last verification > 15 min ago

**E2E**

- Visitor registers → reaches feed
- Creator signs in → lands on `/dashboard/`
- Admin without fresh MFA hits a sensitive mutation → gated until verify

## Governance / Rules

- Every mutation derives caller identity via `getAuthUserId`. Never accept `userId` as an arg from clients.
- Sensitive mutations call `gateOnMfaIfEnrolled` — soft gate that no-ops for non-enrolled users, throws for enrolled users without fresh verification.
- `users.role` flips audit-logged via `audit.log` with `entityType: 'user'`.
- Recovery codes never re-displayed after enrollment — copy-once UX.
- httpOnly + sameSite cookies enforced by Convex Auth; CSRF intrinsic.
