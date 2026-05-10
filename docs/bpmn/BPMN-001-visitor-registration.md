# BPMN-001 — Visitor registration flow

## Purpose

A visitor signs up, verifies their email, and lands as an authenticated
`customer` with a session.

## Trigger

Visitor submits the sign-up form on `/sign-up`.

## Preconditions

- Visitor is unauthenticated.
- Email is not already bound to an existing `users` row.

## Actors / Swimlanes

- **Visitor** — browser submitting credentials.
- **Convex Auth** — `@convex-dev/auth` provider, password flow.
- **Convex Backend** — `users` + `auditLogs` tables, `users.createOrUpdate`.
- **Notify** — `notify.dispatch` action (email channel).

## Main flow

```mermaid
flowchart TD
  subgraph V[Visitor]
    v1[Open /sign-up]
    v2[Submit email + password]
    v3[Click verification link]
    v4[Land on /account]
  end
  subgraph A[Convex Auth]
    a1{{auth.signIn flow=signUp}}
    a2[Issue session token]
  end
  subgraph K[Convex Backend]
    k1[(users<br/>insert role=customer)]
    k2[(auditLogs<br/>action=user.signup)]
    k3[(users<br/>patch emailVerifiedAt)]
  end
  subgraph N[Notify]
    n1{{notify.dispatch<br/>channel=email}}
  end

  v1 --> v2 --> a1 --> k1 --> a2 --> v4
  k1 -.-> k2
  k1 -.-> n1 --> v3 --> k3
```

## Alternative flows

- **Email already in use** → Auth returns `409`, visitor stays on form.
- **Weak password** → Auth provider rejects before any insert.
- **Email never confirmed** → Soft-gate UI surfaces a re-send banner; the
  account still functions but appears unverified in admin.
- **Verification token expired** → user requests a new link; previous
  audit row stays (append-only).

## Postconditions

- One row in `users` with `role='customer'`.
- One audit row `user.signup`.
- Session cookie set; `useQuery(api.users.meSafe)` resolves.

## Realtime events

- `users.meSafe` flips from `null` → user shape.
- Admin `admin.summary` audit feed picks up the new entry.

## AI interactions

None.

## Module mapping

- [M01 — Identity & accounts](../modules/M01-identity-accounts.md)
- [M22 — Audit log](../modules/M22-audit-log.md)
