# M03 — Custom Component Library & Design Token System

## Purpose

Owns every visual surface in DigiPicks. The thin-app contract in `CLAUDE.md`
makes this module load-bearing: apps compose DS components only — no inline
styles, no Tailwind utilities, no raw `className` on DOM elements, no `.css`
files inside `apps/<x>/src`. Tokens centralise color, spacing, typography,
radius, elevation, motion, focus rings.

## Target Roles

System (every end user benefits indirectly)

## Core Features

- ~110 reusable React components across 10 buckets (atoms, forms, surfaces, data, nav, layout, feedback, motion, domain)
- Design tokens in `packages/tokens/src/tokens.css`
- Global resets + scrollbar + focus rings in `packages/tokens/src/globals.css`
- CSS Modules with camelCase class names; class composition via `cx`
- WCAG 2.4.1 SkipLink, 2.4.3 focus traps on Modal + Drawer (`utils/focusTrap.ts`)
- ARIA on charts (`Sparkline` role=img, `ConfidenceGauge` role=meter)
- Public API surface lives only in `packages/ds/src/index.ts`
- CI grep gate enforces every rule

## User Stories

- As a developer, I want to compose a page entirely from DS components.
- As a designer, I want to change a token and see every surface update.
- As a screen-reader user, I want every chart, modal, and button to be announceable.
- As an SRE, I want a CI gate that catches inline styles before they merge.

## Backend / Convex Build

**Tables**

- N/A — DS is a frontend package

(Theme overrides in Convex are deferred — current branding is single-brand.)

## Frontend Build

**Buckets** (`packages/ds/src/components/`)

- `atoms/` — Icon, Logo, Avatar, Badge, AccessBadge, GradeBadge, EventSourceBadge, VerifiedMark, SportTag, Tag, TrustScoreBadge, SkipLink, Bar, ConfidenceBar, ConfidenceGauge, FormDots, Sparkline, Button, FollowButton, Chip, Switch, Checkbox, Radio, Kbd, Odds
- `forms/` — Input, TextArea, Select, Field, Search, FilterGroup, FilterRadio, FilterCheck, FilterChips, SwitchRow, PasswordInput, AuthMethodButton, EventForm, DisputeForm
- `surfaces/` — Card, CardHead, Metric, EmptyState, Placeholder, LockedAnalysis, FeatureCard, Hero, TrustMarquee, CTABanner, StepCard, Testimonial, SplitCTA, PriceCard, AuthCard, AISummary, LockedChannelPanel, AIAssistPanel, TrendingCarousel, MfaEnrollmentCard, InsightCard, PortfolioHero, SubscriptionTile
- `data/` — Table, KV, DataPair, Stat, BigStat, OddsGrid, StatTile
- `nav/` — AppHeader, Topbar, Sidebar, NavSection, NavItem, NavDivider, RoleSwitcher, ThemeToggle, ThemeIconButton, Segmented, Tabs, Breadcrumb
- `layout/` — AppLayout, PublicLayout, DashboardLayout, AuthLayout, Container, Grid, Heading, Section, PageHead, PageHeader, TitleSub, MetricGrid, StatGrid, Footer, Row, Col, Stack, Spacer, Divider, Eyebrow, Muted, Mono, Serif, SectionHead
- `feedback/` — ResponsibleNote, ResponsibleSection, Accordion, AccordionItem, FAQList, Modal, Drawer, Toast, PushNotificationPrompt, ReferralShareModal
- `motion/` — Reveal, Stagger, StaggerItem
- `domain/` — CreatorChip, PersonRow, HeroLivePanel, CreatorCard, EventCard, PickCard, ChatPanel, StreamEmbed, PricingModal

**Tokens** — `packages/tokens/src/tokens.css`

- Color (`--bg-1`..3, `--t-1`..3, `--primary`, `--ok`, `--warn`, `--danger`, `--gold`)
- Spacing scale (`--space-1`..12)
- Typography (`--text-2xs`..3xl`, `--weight-_`, `--leading-_`, `--tracking-\*`)
- Radius (`--r-xs`..lg)
- Elevation (`--shadow-sm`..2xl)
- Motion (`--dur-fast`..base, `--ease-out`)
- Focus ring (`--focus-ring`, `--focus-offset`)

## Testing

**Unit**

- Component prop matrix: variants render the right modifier classes
- `cx` utility composes classes correctly with falsy values

**Integration**

- Modal / Drawer focus trap activates + restores focus on close
- SkipLink targets `#main-content` on every layout

**E2E**

- Lighthouse a11y ≥ 95 on Landing, Feed, CreatorDetail
- Visual regression on key components (deferred — needs Storybook + Chromatic)

## Governance / Rules

- **Apps may not import deep paths.** Import from `@digipicks/ds` only — what's not exported in `packages/ds/src/index.ts` doesn't exist for apps.
- **No `.css` file under `apps/<x>/src`.** Apps import `@digipicks/ds/styles` exactly once in `main.tsx`.
- **Every value in a CSS Module is `var(--token-name)`.** Hardcoded colors / px / em / ms are forbidden with a narrow whitelist (1-3px borders, 0/100%/50%, currentColor, transparent).
- **No `className=` on plain DOM elements in apps.** Layout uses DS primitives (`Row`, `Col`, `Stack`, `Container`).
- **No `style={{…}}` on app code.** Inline `style` in DS components is permitted only for dynamic CSS custom properties (`{ '--av-size': size + 'px' }`).
- CI gate (`/.github/workflows/ci.yml`) greps `apps/<x>/src` for violations on every push.
