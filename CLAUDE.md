<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

# DigiPicks — agent guide

**DigiPicks** is a creator network for premium sports picks. Verified creators publish picks to subscribers; subscribers track results and follow plays. This file is the contract for working in this monorepo.

---

## 1. Workspace layout

```
.
├── apps/
│   ├── web/             # public marketing site (landing, /events, /creators, /apply)
│   └── dashboard/       # creator-studio dashboard (overview, picks, subscribers, …)
├── packages/
│   ├── tokens/          # design tokens (CSS variables) — the only global stylesheet
│   ├── ds/              # @digipicks/ds — design system: components + module CSS
│   ├── app-shell/       # ThemeProvider, ConvexProvider
│   ├── sdk/             # convex-backed data hooks (stub)
│   ├── shared/          # shared TypeScript types & constants
│   ├── eslint-config/   # shared eslint
│   └── tsconfig/        # shared tsconfig presets
├── convex/              # convex schema + functions
└── prototype/           # original high-fidelity HTML/JSX prototype (read-only reference)
```

Workspace manager: **pnpm**. Build orchestrator: **vite** per app, **tsc** for typechecking. CSS pipeline: Tailwind v4 + CSS Modules (CSS Modules is the source of truth for component styles; Tailwind exists for the `@theme` bridge but **must not be used in app code**).

---

## 2. Architecture (read this before writing code)

### 2.1 Styling rules — non-negotiable

1. **No inline `style={{…}}`** in app code or DS components. The only allowed inline styles are dynamic CSS custom properties on a wrapper element (`style={{ '--av-size': '32px' } as React.CSSProperties}`) when the value is genuinely runtime-driven (avatar sizes, percent fills, dynamic colors).
2. **No Tailwind utility classes in app code.** No `className="flex gap-3 max-w-4xl"`. The `@theme` bridge is for the build, not for ergonomics.
3. **No raw `className` strings on plain DOM elements in apps.** If you need a flex row, use `<Row>` from DS. A vertical stack? `<Stack>`. A panel? `<Card>`. A heading? `<PageHead>` or DS components. Apps compose DS components — they do not author CSS.
4. **No custom CSS files in apps.** If a styling pattern doesn't exist, add it to the DS as a new component or extend an existing component's prop API.
5. **Every value comes from a token.** Never hardcode `#1c9cf0`, `14px`, `0 8px 24px`, or `1.45` — use `var(--blue)`, `var(--space-3)`, `var(--shadow-md)`, `var(--leading-normal)`.

### 2.2 The DS package (`packages/ds`)

Pattern (one folder per component):
```
packages/ds/src/components/<bucket>/<Component>/<Component>.tsx
packages/ds/src/components/<bucket>/<Component>/<Component>.module.css
```

Buckets:
- `atoms/` — primitives that don't compose other DS components (Icon, Avatar, Badge, Button, Switch, …)
- `forms/` — input controls (Input, TextArea, Select, Field, Search, FilterGroup, …)
- `surfaces/` — visual surfaces (Card, Metric, EmptyState, PriceCard, Hero, CTABanner, …)
- `data/` — tabular & display (Table, KV, DataPair, Stat, BigStat)
- `nav/` — navigation chrome (AppHeader, Topbar, Sidebar, NavItem, RoleSwitcher, ThemeToggle, …)
- `layout/` — structural primitives (PublicLayout, AppLayout, Container, Row, Col, Stack, Footer, …)
- `feedback/` — overlays & disclosure (Modal, Drawer, Accordion, Toast, ResponsibleNote)
- `domain/` — DigiPicks-specific compositions (CreatorChip, CreatorCard, EventCard, PickCard)

Component file pattern (mirrors `Button` exactly):

```tsx
import React from 'react';
import { cx } from '../../../utils/cx';
import s from './Foo.module.css';

export interface FooProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'primary' | 'muted';
  size?: 'sm' | 'md';
}

export const Foo = React.forwardRef<HTMLDivElement, FooProps>(function Foo(
  { tone = 'primary', size = 'md', className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx(s.foo, s[tone], size !== 'md' && s[size], className)} {...rest} />;
});
```

CSS Module conventions:
- camelCase class names (Vite default; access as `s.fooName`).
- Reference tokens via `var(--token)`. **No raw values**.
- Co-locate the `.module.css` next to its `.tsx`. Never share modules across components.
- For dynamic CSS custom properties, set them inline on the rendered element with `as React.CSSProperties` (e.g. `style={{ '--av-size': size + 'px' }}`).

Public exports: `packages/ds/src/index.ts`. Apps import only from `@digipicks/ds` (no deep paths).

### 2.3 The tokens package (`packages/tokens`)

The **only** global stylesheet. Apps import once via `@digipicks/ds/styles` (which re-imports `@digipicks/tokens`).

Files:
- `tokens.css` — every CSS variable. Defines `:root`/`[data-theme='light']` and `.dark`/`[data-theme='dark']`. Both selectors are populated so theme can be switched via either class or attribute.
- `theme.css` — `@theme inline` Tailwind v4 bridge.
- `globals.css` — base resets, body, headings, scrollbars, selection, focus rings.
- `fonts.css` — Google Fonts (Open Sans, Geist, JetBrains Mono, Instrument Serif).

Token namespaces:
- **surfaces**: `--bg-0..--bg-elev`, shadcn-compatible (`--background`, `--card`, `--popover`).
- **lines**: `--line`, `--line-soft`, `--line-strong`.
- **text**: `--t-1..--t-4`, `--t-on-accent`.
- **brand**: `--primary`, `--primary-foreground`, `--accent`, `--ring`.
- **semantic**: `--green/--gold/--red/--amber/--blue/--violet`, each with `-soft` and `-line` variants.
- **sport accents**: `--sport-{nfl,nba,nhl,mlb,soc,ten,ufc}`.
- **typography**: `--f-sans/--f-mono/--f-serif`, `--text-2xs..--text-8xl`, `--weight-light..--weight-extrabold`, `--tracking-tightest..--tracking-widest`, `--leading-tight..--leading-relaxed`.
- **space**: `--space-0..--space-32` (4px base).
- **radius**: `--r-xs..--r-2xl`, `--r-pill`.
- **shadow**: `--shadow-2xs..--shadow-2xl`, `--shadow-inset`, `--shadow-glow`.
- **motion**: `--dur-instant..--dur-slower`, `--ease-out/--ease-in-out/--ease-spring`.
- **z-index**: `--z-dropdown/--z-sticky/--z-overlay/--z-modal/--z-toast/--z-tooltip`.
- **layout**: `--container-{sm,md,lg,xl,2xl}`, `--header-h`, `--topbar-h`, `--sidebar-w`.

When you need a new value, **add it to `tokens.css`** rather than hardcoding.

### 2.4 Theme (`packages/app-shell`)

`ThemeProvider` sets both `.dark` class and `data-theme` attribute on `<html>`, persisted in `localStorage('dp-theme')`. `useTheme()` returns `{ colorScheme, isDark, toggleTheme, setColorScheme }`. DS components like `<ThemeToggle>` and `<ThemeIconButton>` already wire up to it.

### 2.5 Apps (`apps/web`, `apps/dashboard`)

Apps:
- Wrap `<App />` in `<BrowserRouter><ThemeProvider>` from `main.tsx`.
- Import the global stylesheet exactly once: `import '@digipicks/ds/styles';` in `main.tsx`.
- Compose pages from DS components. **Pages contain layout & data; DS components contain visuals.**
- For routing: `react-router-dom`. For navigation actions inside DS components, prefer `useNavigate()` rather than wrapping `<Button>` inside `<Link>` (avoids button-in-anchor warnings).
- Mock data in `apps/<app>/src/data/mock.ts` until SDK hooks land.

---

## 3. Working with this codebase

### 3.1 Where to put new code

| Need | Where |
| --- | --- |
| New visual pattern reused 2+ places | `packages/ds/src/components/<bucket>/<Component>/` |
| New token / spacing / color value | `packages/tokens/src/tokens.css` |
| New domain shape (Pick, Creator, Event types) | `packages/shared/src/types/` |
| Convex query/mutation | `convex/` + hook in `packages/sdk/src/` |
| Page (route) | `apps/<app>/src/pages/<Page>.tsx` (composes DS, no styles) |
| Theme/provider concern | `packages/app-shell/src/providers/` |

### 3.2 Common scripts (run from repo root)

```bash
pnpm dev                  # convex + web + dashboard concurrently
pnpm dev:web              # web only
pnpm dev:dashboard        # dashboard only
pnpm dev:convex           # convex only
pnpm build                # build everything
pnpm typecheck            # tsc --noEmit across all packages
pnpm lint                 # eslint (where configured)
```

### 3.3 Adding a DS component (the recipe)

1. Pick the bucket (atom/form/surface/data/nav/layout/feedback/domain).
2. Create `packages/ds/src/components/<bucket>/<Foo>/Foo.tsx` and `Foo.module.css`.
3. Mirror the `Button` pattern. Use `cx` for class composition. Use `var(--token)` exclusively in CSS.
4. Add the export to `packages/ds/src/index.ts`.
5. Run `pnpm --filter @digipicks/ds typecheck`.

### 3.4 Adding a new page

1. Create `apps/<app>/src/pages/<Page>.tsx`.
2. Compose with `<PublicLayout>` (web) or under `<AppLayout>` route shell (dashboard).
3. Use `<PageHead>` for the page title + sub.
4. Use `<Section>`, `<Stack>`, `<Row>`, `<Col>`, `<Container>` for structure.
5. Use domain components (CreatorCard, EventCard, PickCard, …) for content surfaces.
6. **Never** add a `style` prop, a Tailwind utility, or a raw `className` string on a plain DOM element.

### 3.5 Don't

- Don't import deep paths from `@digipicks/ds`. Always import from the package root.
- Don't add `color: '#xxx'` or `padding: 14px` inline. Use a token. If no token fits, add one.
- Don't write `<div className="flex items-center gap-2">`. Use `<Row gap={2}>`.
- Don't write a global stylesheet in an app. There is one global stylesheet, and it lives in `@digipicks/tokens`.
- Don't author component CSS in `packages/ds/src/styles.css`. That file imports tokens only. Per-component CSS lives in `<Component>.module.css`.
- Don't fork the `prototype/` folder. It is read-only reference for visual fidelity.

---

## 4. Visual conventions

The design language is **modern, professional, sports-network confident**. Larger typography than typical SaaS, generous whitespace, bold serif italic accents on hero copy, X/Twitter-blue primary, dense data when needed (mono tabular for odds/units), tight 1.5-stroke line iconography.

Type scale (from `--text-*` tokens):
- Display: `--text-7xl` / `--text-8xl` for hero copy
- H1: `--text-4xl` / `--text-5xl`
- H2: `--text-2xl` / `--text-3xl`
- H3: `--text-lg` / `--text-xl`
- Body: `--text-base` / `--text-md`
- Meta: `--text-sm` / `--text-xs`
- Eyebrow: `--text-2xs` mono uppercase tracked-wide

Spacing: snap to the `--space-*` scale (4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 / 40 / 48 / 64 / 80 / 96 / 128). Section gaps are typically `--space-20` to `--space-32`.

Colors: prefer the brand semantic (`--green` for win, `--red` for loss, `--gold` for premium, `--violet` for VIP) over raw hex. Subtle backgrounds use the `-soft` variants; thin borders use the `-line` variants.

---

## 5. Decision log

| Decision | Rationale |
| --- | --- |
| CSS Modules over global classes | Auto-scoping prevents name collisions; component owns its styles; tree-shakable. |
| Tokens stay global | Variables must be available to every module; the `@theme inline` bridge needs them. |
| No Tailwind utilities in apps | Forces all visuals through DS — keeps the design system coherent. |
| `data-theme` + `.dark` both set | Tailwind dark variant requires `.dark`; prototype-style attribute selectors require `data-theme`. We support both. |
| Public nav uses `useNavigate()` not `<Link><Button>` | Avoids invalid button-in-anchor nesting; cleaner accessibility tree. |
| Domain components live in `ds/components/domain/` | They're reusable across both apps (web shows CreatorCard/EventCard; dashboard shows PickCard). |

When adding a non-obvious decision, append a row here and link to a PR.
