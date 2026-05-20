<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

# DigiPicks — Reusable-Component Doctrine (READ FIRST)

**This file is a hard contract.** Every agent and every contributor working in
this monorepo follows these rules. There are no exceptions, no "just this
once," no "small inline tweak."

If a rule below ever feels in the way, the answer is to **extend the design
system or add a token**, not to bend the rule.

---

## 1. The single source of truth

| Layer                                           | Lives in                          | Authoritative for                                                                                     |
| ----------------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Design tokens (CSS variables)                   | `packages/tokens/src/tokens.css`  | Every color, size, radius, shadow, motion, z-index, container width, font, weight, tracking, leading. |
| Global resets / body / scrollbars / focus rings | `packages/tokens/src/globals.css` | Browser-level baseline.                                                                               |
| Reusable React components + their CSS Modules   | `packages/ds/src/components/**`   | Every visual element rendered in any app.                                                             |
| Public DS API                                   | `packages/ds/src/index.ts`        | The only surface apps may import from.                                                                |

`packages/tokens` and `packages/ds` are the **only** packages that may author
styles. Everywhere else consumes.

---

## 2. Hard rules (apps/\*\*)

These are violations. They will be reverted on sight:

1. **No `style={{…}}` on app code, ever, for any static value.** The only
   permissible inline `style` in app code is forwarding to a DS component's
   prop, not styling the DOM. Apps don't dress DOM nodes — DS components do.
2. **No raw `className` strings in apps.** No `<div className="…">`,
   `<span className="…">`, etc. The only acceptable raw HTML in app pages is
   `<main>`, `<form>`, `<em>`, `<br />` — all without `className`.
3. **No Tailwind utility classes anywhere in apps.** No `flex gap-3 p-4
text-xl bg-card rounded-lg`. The `@theme inline` bridge in
   `packages/tokens/src/theme.css` exists for the build, not for ergonomics.
4. **No `.css` or `.module.css` files inside any `apps/**`source tree.** The
only stylesheet apps import is`@digipicks/ds/styles`(in`main.tsx`,
   exactly once).
5. **No deep imports from `@digipicks/ds`.** Apps import from the package
   root only. If something isn't exported from `packages/ds/src/index.ts`,
   it doesn't exist as far as apps are concerned.
6. **No hardcoded colors, sizes, fonts, durations, or shadows in app code.**
   These never appear in app TSX:
   `padding: 14`, `color: '#1c9cf0'`, `gap: 16`, `font-size: 18`. If you
   think you need one, you don't — you need a DS component or a token.

If you cannot accomplish a layout using only DS components, **the answer is
to extend the DS**, not to add CSS or inline styles to an app.

---

## 3. Hard rules (packages/ds/\*\*)

1. Each component lives in its own folder:
   `packages/ds/src/components/<bucket>/<Foo>/Foo.tsx` +
   `packages/ds/src/components/<bucket>/<Foo>/Foo.module.css`.
2. CSS Modules use **camelCase** class names (`s.btnPrimary`), are imported
   as `import s from './Foo.module.css'`, and combined via `cx` from
   `packages/ds/src/utils/cx.ts`.
3. **Every value in a CSS Module is a token reference**: `var(--token-name)`.
   Hardcoded `#hex`, `Npx`, `Nrem`, `Nem`, `Nms`, `Ns` are forbidden, with
   the following narrow whitelist:
   - `1px` / `2px` / `3px` for borders, dividers, focus rings.
   - `0`, `100%`, `50%`, percent values, `currentColor`, `transparent`.
   - `#000` / `#fff` inside SVG mask gradients only.
   - The two documented chevron / verified-mark literals (`#6E7682` in
     `Select.module.css`, `#08090B` in `Icon.tsx`) — both annotated.
   - Inline `linear-gradient(...)` / `rgba(...)` overlay literals **only**
     when the value is genuinely a translucent surface treatment that
     can't be represented with the existing color tokens.
4. **No new global CSS classes.** All component styles are scoped via
   `.module.css`. The legacy globals in `packages/ds/src/styles.css` are not
   to be extended.
5. **Inline `style={{…}}` in DS components is permitted only for dynamic
   CSS custom properties** that need to vary per-instance (e.g.
   `style={{ '--av-size': '32px', '--av-color': color } as React.CSSProperties}`
   on `Avatar`). Static values still go in the module.
6. **All public components are exported from `packages/ds/src/index.ts`.**
   No deep-import escape hatches.
7. **If you need a value that doesn't exist as a token**, add it to
   `packages/tokens/src/tokens.css` first, then reference it. Never inline.

---

## 4. Where new things go

| You need to add…                            | Where it goes                                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------------------- |
| A new color / size / shadow / motion value  | `packages/tokens/src/tokens.css` (and `theme.css` if exposed to Tailwind)               |
| A visual pattern reused 2+ places           | A new DS component under the right bucket, plus an export in `packages/ds/src/index.ts` |
| A page (route)                              | `apps/<app>/src/pages/<Page>.tsx` — composing DS components only                        |
| A domain shape (Pick, Creator, Event types) | `packages/shared/src/types/`                                                            |
| A Convex query / mutation                   | `convex/` + a hook in `packages/sdk/src/`                                               |
| Theme / provider concern                    | `packages/app-shell/src/providers/`                                                     |

DS buckets:
`atoms/` (Icon, Avatar, Badge, Button, Switch, …)
`forms/` (Input, TextArea, Select, Field, Search, FilterChips, SwitchRow, …)
`surfaces/` (Card, CardHead, Metric, EmptyState, FeatureCard, Hero, CTABanner, PriceCard, StepCard, Testimonial, SplitCTA, TrustMarquee, ResponsibleSection, …)
`data/` (Table, KV, DataPair, Stat, BigStat)
`nav/` (AppHeader, Topbar, Sidebar, NavItem, RoleSwitcher, ThemeToggle, Segmented, Tabs, Breadcrumb)
`layout/` (PublicLayout, AppLayout, DashboardLayout, Container, Grid, Heading, PageHead, PageHeader, Section, Footer, Row, Col, Stack, Spacer, Divider, Eyebrow, Muted, Mono, Serif, MetricGrid, StatGrid, TitleSub)
`feedback/` (ResponsibleNote, Accordion, FAQList, Modal, Drawer, Toast)
`domain/` (CreatorChip, CreatorCard, EventCard, FeaturedEventCard, PickCard, PersonRow, HeroLivePanel)
`motion/` (Reveal, Stagger, StaggerItem)

---

## 5. Adding a DS component (the recipe)

1. Pick the bucket.
2. Create `packages/ds/src/components/<bucket>/<Foo>/Foo.tsx` and
   `Foo.module.css`. Mirror an existing component (`Button` is the canonical
   example).
3. Use `cx` for class composition. Use `var(--token)` exclusively in CSS.
4. Add the export to `packages/ds/src/index.ts`.
5. Run `pnpm --filter @digipicks/ds typecheck`.

Component file pattern:

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
  return (
    <div ref={ref} className={cx(s.foo, s[tone], size !== 'md' && s[size], className)} {...rest} />
  );
});
```

---

## 6. Adding a page (the recipe)

1. Create `apps/<app>/src/pages/<Page>.tsx`.
2. Wrap content in `<PublicLayout>` (public marketing routes) or under the
   `<DashboardShell>` route at `/dashboard/*` (creator studio routes). Both
   live in the single `apps/web` Vite app.
3. Use `<PageHead>` (or `<PageHeader>`) for the page title + sub.
4. Use `<Section>` for section grouping with eyebrow / title / sub / action.
5. Use `<Container>`, `<Grid>`, `<Stack>`, `<Row>`, `<Col>` for structure.
6. Use domain components (`CreatorCard`, `EventCard`, `PickCard`, `PriceCard`,
   `Testimonial`, `StepCard`, `SplitCTA`, …) for content.
7. **Never** add a `style` prop, a Tailwind utility, or a raw `className`
   string on a plain DOM element.

---

## 7. Verification (run before declaring done)

```bash
pnpm -r --if-present typecheck
pnpm -r --if-present lint
pnpm --filter @digipicks/web build
```

Plus the strict-mode greps — every one of these must return zero meaningful
hits inside `apps/**`:

```bash
# inline static styles in apps
grep -rE "style=\{\{" apps --include="*.tsx"
# raw className in apps
grep -rnE 'className=' apps --include="*.tsx" | grep -vE '\.module\.css|\bcx\(|s\.|className: '
# tailwind utilities in apps
grep -rE 'className="[^"]*\b(flex|grid|gap-|p-|m-|text-|bg-|border|rounded|w-|h-|max-w|min-w|space-|items-|justify-)' apps --include="*.tsx"
# any css file in apps
find apps -name "*.css"
```

---

## 8. The quick "is this allowed?" checklist

| Pattern                                                                                      | Verdict                                  |
| -------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `<div className="flex gap-3">` in an app                                                     | ❌ Use `<Row gap={3}>`.                  |
| `<h2 style={{ fontSize: 30 }}>` in an app                                                    | ❌ Use `<Heading level={2} size="3xl">`. |
| `<span style={{ color: '#1c9cf0' }}>` anywhere                                               | ❌ Use a tokenized DS component / class. |
| `<button className="btn-primary">` in an app                                                 | ❌ Use `<Button variant="primary">`.     |
| Adding a new `.module.css` inside `apps/web/src/`                                            | ❌ Move it into a DS component.          |
| Importing `@digipicks/ds/components/atoms/Button/Button`                                     | ❌ Import from `@digipicks/ds`.          |
| `padding: 14px` in a DS module                                                               | ❌ Use `var(--space-3)` or add a token.  |
| `color: #1c9cf0` in a DS module                                                              | ❌ Use `var(--primary)`.                 |
| `style={{ '--av-size': size + 'px' }}` on `<Avatar>` (DS internal)                           | ✅ Dynamic CSS custom property.          |
| `<Row gap={3}>` in an app                                                                    | ✅ Layout primitive.                     |
| `<Section eyebrow="…" title="…">…</Section>` in an app                                       | ✅ Compose DS.                           |
| `<Button variant="primary" iconRight="arrow-right">…</Button>`                               | ✅ DS API.                               |
| Adding `--space-9: 36px` to `tokens.css` because nothing fits                                | ✅ Token first, then reference.          |
| Building a new `<NumberStep>` DS component because two pages duplicate the same stack of DOM | ✅ Extract first, reuse.                 |

---

**Summary in one line:** _Apps compose DS components only — no inline styles,
no Tailwind utilities, no raw classNames, no custom CSS files. The DS
authors all visuals; the tokens authoritatively define every value._

---

## 9. Stitch design exports (reference zips)

The product owner provides **Stitch / EdgePicks** zips per feature (`screen.png`, `code.html`, `DESIGN.md`). Full agent rules: **`.cursor/rules/stitch-design-references.mdc`**.

| From Stitch                                       | In this repo                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| Layout, sections, copy, flows                     | Implement with DS components + routes/Convex                               |
| Colors, fonts, radii in `DESIGN.md` / `code.html` | **Do not** copy into `packages/tokens` — map to **existing** CSS variables |
| New UI pattern used 2+ times                      | New component in `packages/ds/` referencing existing tokens only           |

Archive checked-in references under `docs/design-references/<feature-slug>/`.

---

## 10. Studio page archetypes (Account / Creator / Admin)

Authenticated shells (`/account/*`, `/dashboard/*`, `/admin/*`) share a page contract:

1. `Container size="2xl"` + `Stack gap={6}`
2. `StudioPageHeader` — `eyebrow: "Account · …"` / `"Studio · …"` / `"Admin · …"`
3. `AccountRefineCard` (alias `StudioRefineCard`) when the page has search, sort, or filters
4. Primary content — often `StudioDashLayout` (8/4 split for inbox-style pages)
5. `QuickActionGrid` — `accountCrossLinks`, `studioCrossLinks`, or `adminCrossLinks`

**Directory-style pages** (e.g. Discover) may insert a full-width featured rail (`span={12}`) between the refine card and results. **Form/settings pages** omit the refine card.
