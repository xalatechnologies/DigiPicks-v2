# Convex Components Reference — DigiPicks

## What Are Components?
Convex Components are **sandboxed mini-backends** — they have their own tables, functions, and isolated execution.
They can't read your app's tables unless you explicitly pass data in.

## When to Use Components (for DigiPicks)
| Feature | Component? | Rationale |
|---------|-----------|-----------|
| Notifications | ✅ Yes | Own tables, isolated from core domain |
| Rate limiting | ✅ Yes | Use `@convex-dev/ratelimiter` |
| AI Agent (future) | ✅ Yes | Use `@convex-dev/agent` |
| Picks/Creators/Events | ❌ No | Core domain logic, belongs in `convex/` |
| Auth | ❌ No | Use Convex Auth or external provider |

## Installation Pattern
```ts
// 1. npm install
npm i @convex-dev/ratelimiter

// 2. Register in convex/convex.config.ts
import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/ratelimiter/convex.config.js";
const app = defineApp();
app.use(rateLimiter);
export default app;

// 3. Run npx convex dev to generate types

// 4. Use via components object
import { components } from "./_generated/api.js";
```

## Local Component Pattern
```
convex/
  components/
    notifications/
      convex.config.ts    # defineComponent("notifications")
      schema.ts           # Own tables
      lib.ts              # Own functions
  convex.config.ts        # app.use(notifications)
  notifications.ts        # App wrapper (adds auth/env)
```

## Critical Rules
1. **Auth stays in app** — `ctx.auth` is NOT available in components
2. **Env vars stay in app** — components can't read `process.env`
3. **IDs cross boundary as strings** — use `v.string()` not `v.id("parentTable")`
4. **Import from component's own `_generated`** — not the app's
5. **Don't expose component functions to clients** — create app wrappers
6. **Pagination** — use `paginator` from `convex-helpers` (built-in `.paginate()` doesn't work across boundary)

## Available Component Skills
- `/convex-create-component` — Already installed, full local/packaged/hybrid patterns
- References: `references/local-components.md`, `references/packaged-components.md`

## Useful Published Components
| Component | Package | Use Case |
|-----------|---------|----------|
| Agent | `@convex-dev/agent` | AI agents with threads |
| Rate Limiter | `@convex-dev/ratelimiter` | Throttle API calls |
| Auth | `@convex-dev/auth` | Built-in auth |
| Full directory | [convex.dev/components](https://convex.dev/components) | Browse all |
