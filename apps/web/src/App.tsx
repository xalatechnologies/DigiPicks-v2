import React from 'react';
import { Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useConvexAuth, useQuery } from './auth/convexAuth';
import {
  PublicLayout,
  Container,
  Section,
  Row,
  Logo,
  Button,
  ThemeIconButton,
  Footer,
  Input,
  Icon,
  Badge,
  Spacer,
  EmptyState,
} from '@digipicks/ds';
import { AccountUserMenu } from './auth/AccountUserMenu';
import { becomeCreatorCtaLabel, navigateBecomeCreator } from './lib/becomeCreator';
import { ADMIN_ROUTE_ENTRIES } from './admin/routeManifest';
import { api } from '../../../convex/_generated/api';
import { Landing } from './pages/Landing';
import { Events } from './pages/Events';
import { Creators } from './pages/Creators';
import { AuthGate } from './auth/AuthGate';

// Critical-path public pages (Landing, Events, Creators) ship in the main
// bundle. Everything else is route-level code-split — a first-time visitor
// only downloads the homepage chunk.
const CreatorDetail = React.lazy(() =>
  import('./pages/CreatorDetail').then((m) => ({ default: m.CreatorDetail })),
);
const CreatorCheckout = React.lazy(() =>
  import('./pages/CreatorCheckout').then((m) => ({ default: m.CreatorCheckout })),
);
const CreatorSubscribed = React.lazy(() =>
  import('./pages/CreatorSubscribed').then((m) => ({ default: m.CreatorSubscribed })),
);
const OddsIntel = React.lazy(() =>
  import('./pages/OddsIntel').then((m) => ({ default: m.OddsIntel })),
);
const Apply = React.lazy(() => import('./pages/Apply').then((m) => ({ default: m.Apply })));
import { Auth } from './pages/Auth';
const Feed = React.lazy(() => import('./pages/Feed').then((m) => ({ default: m.Feed })));
const Saved = React.lazy(() => import('./pages/Saved').then((m) => ({ default: m.Saved })));
const Community = React.lazy(() =>
  import('./pages/Community').then((m) => ({ default: m.Community })),
);
const Notifications = React.lazy(() =>
  import('./pages/Notifications').then((m) => ({ default: m.Notifications })),
);
const AdminGateLayout = React.lazy(() =>
  import('./admin/AdminGateLayout').then((m) => ({ default: m.AdminGateLayout })),
);
const PricingPage = React.lazy(() =>
  import('./pages/trustLegalPages').then((m) => ({ default: m.PricingPage })),
);
const TrustVerificationPage = React.lazy(() =>
  import('./pages/trustLegalPages').then((m) => ({ default: m.TrustVerificationPage })),
);
const ResultsMethodologyPage = React.lazy(() =>
  import('./pages/trustLegalPages').then((m) => ({ default: m.ResultsMethodologyPage })),
);
const TrustDisputesPage = React.lazy(() =>
  import('./pages/trustLegalPages').then((m) => ({ default: m.TrustDisputesPage })),
);
const ResponsibleBettingPage = React.lazy(() =>
  import('./pages/trustLegalPages').then((m) => ({ default: m.ResponsibleBettingPage })),
);
const AboutPage = React.lazy(() =>
  import('./pages/trustLegalPages').then((m) => ({ default: m.AboutPage })),
);
const PressPage = React.lazy(() =>
  import('./pages/trustLegalPages').then((m) => ({ default: m.PressPage })),
);
const BrandPage = React.lazy(() =>
  import('./pages/trustLegalPages').then((m) => ({ default: m.BrandPage })),
);
const ContactPage = React.lazy(() =>
  import('./pages/trustLegalPages').then((m) => ({ default: m.ContactPage })),
);
const TermsPage = React.lazy(() =>
  import('./pages/trustLegalPages').then((m) => ({ default: m.TermsPage })),
);
const PrivacyPage = React.lazy(() =>
  import('./pages/trustLegalPages').then((m) => ({ default: m.PrivacyPage })),
);
const RefundsPage = React.lazy(() =>
  import('./pages/trustLegalPages').then((m) => ({ default: m.RefundsPage })),
);
const AgeRestrictionPage = React.lazy(() =>
  import('./pages/trustLegalPages').then((m) => ({ default: m.AgeRestrictionPage })),
);
const DashboardRoutes = React.lazy(() => import('./dashboard/Routes'));
const AccountRoutes = React.lazy(() => import('./account/Routes'));

// Shared fallback for lazy-loaded pages, rendered inside the public layout.
function PageFallback({ title = 'Loading…' }: { title?: string }) {
  return (
    <main>
      <Container size="xl">
        <Section noReveal>
          <EmptyState icon="lock" title={title} />
        </Section>
      </Container>
    </main>
  );
}

const NAV_ITEMS: { to: string; label: string }[] = [
  { to: '/events', label: 'Events' },
  { to: '/creators', label: 'Creators' },
  { to: '/odds', label: 'Odds Intel' },
];

// AccountUserMenu lives in apps/web/src/auth/AccountUserMenu.tsx so the
// public header / account shell / dashboard shell all share the same
// dropdown. Re-import below.

function NotificationsBell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const me = useQuery(api.users.meSafe, isAuthenticated ? {} : 'skip');
  const unread = useQuery(
    api.notifications.unreadCount,
    isAuthenticated && !authLoading && me !== undefined && me !== null ? {} : 'skip',
  );

  if (!isAuthenticated || authLoading || me === undefined || me === null) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      iconOnly
      iconLeft="bell"
      aria-label={unread && unread > 0 ? `${unread} unread notifications` : 'Notifications'}
      onClick={() => navigate('/notifications')}
    >
      {unread && unread > 0 ? (
        <Badge tone="red" dot>
          {unread > 9 ? '9+' : String(unread)}
        </Badge>
      ) : null}
    </Button>
  );
}

function PublicHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const me = useQuery(api.users.meSafe, isAuthenticated ? {} : 'skip');

  return (
    <Container size="2xl">
      <Row gap={6}>
        <Logo size={36} showWord onClick={() => navigate('/')} aria-label="DigiPicks home" />

        <Spacer />

        <Row gap={1}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
            return (
              <Button
                key={item.to}
                variant={isActive ? 'secondary' : 'ghost'}
                onClick={() => navigate(item.to)}
              >
                {item.label}
              </Button>
            );
          })}
        </Row>

        <Spacer />

        <Row gap={2}>
          <NotificationsBell />
          <ThemeIconButton />
          <Button
            variant="outline"
            iconRight="sparkles"
            disabled={authLoading || (isAuthenticated && me === undefined)}
            onClick={() =>
              navigateBecomeCreator(navigate, {
                isAuthenticated,
                creatorId: me?.creatorId ?? null,
              })
            }
          >
            {becomeCreatorCtaLabel(me?.creatorId ?? null)}
          </Button>
          <AccountUserMenu />
        </Row>
      </Row>
    </Container>
  );
}

function PublicFooter() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  const columns = [
    {
      title: 'Product',
      items: [
        { label: 'Creators', href: '/creators' },
        { label: "Today's Events", href: '/events' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Apply', href: '/apply' },
      ],
    },
    {
      title: 'Trust',
      items: [
        { label: 'Verification', href: '/trust/verification' },
        { label: 'Results methodology', href: '/trust/results-methodology' },
        { label: 'Disputes', href: '/trust/disputes' },
        { label: 'Responsible betting', href: '/responsible-betting' },
      ],
    },
    {
      title: 'Company',
      items: [
        { label: 'About', href: '/about' },
        { label: 'Press', href: '/press' },
        { label: 'Brand', href: '/brand' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Legal',
      items: [
        { label: 'Terms', href: '/legal/terms' },
        { label: 'Privacy', href: '/legal/privacy' },
        { label: 'Refunds', href: '/legal/refunds' },
        { label: '21+ only', href: '/legal/age' },
      ],
    },
  ];

  const year = new Date().getFullYear();

  return (
    <Footer
      brand={<Logo size={28} showWord onClick={() => navigate('/')} aria-label="DigiPicks home" />}
      brandEyebrow="Creator network"
      tagline="Verified creators, transparent results, and subscriber-first billing."
      bottomLeft={<>© {year} DigiPicks</>}
      social={[
        {
          href: 'https://x.com',
          label: 'X (Twitter)',
          icon: <Icon name="message" size={16} />,
        },
        {
          href: 'https://discord.com',
          label: 'Discord',
          icon: <Icon name="users" size={16} />,
        },
        {
          href: 'https://www.youtube.com',
          label: 'YouTube',
          icon: <Icon name="play" size={16} />,
        },
        { href: '/contact', label: 'Contact', icon: <Icon name="inbox" size={16} /> },
      ]}
      newsletter={
        isHome
          ? {
              title: "Get tonight's slate in your inbox.",
              sub: "A weekly digest of the network's top picks, win-rate movers, and new creators. No spam — unsubscribe anytime.",
              form: (
                <Row gap={2}>
                  <Input type="email" placeholder="you@example.com" aria-label="Email address" />
                  <Button variant="primary" iconRight="arrow-right">
                    Subscribe
                  </Button>
                </Row>
              ),
              fine: 'No spam. Unsubscribe with one click.',
            }
          : undefined
      }
      columns={columns}
      trust={[
        { icon: <Icon name="verified" size={14} />, label: 'Manual creator verification' },
        { icon: <Icon name="shield" size={14} />, label: 'Stripe-backed billing' },
        { icon: <Icon name="audit" size={14} />, label: 'Independent grading' },
        { icon: <Icon name="lock" size={14} />, label: '21+ age-gated' },
      ]}
      credit={
        <>
          Developed by
          <a href="https://xala.no" target="_blank" rel="noopener noreferrer">
            Xala Technologies AS
            <Icon name="arrow-right" size={11} />
          </a>
        </>
      }
    />
  );
}

function PublicShell() {
  return (
    <PublicLayout header={<PublicHeader />} footer={<PublicFooter />}>
      <React.Suspense fallback={<PageFallback />}>
        <Outlet />
      </React.Suspense>
    </PublicLayout>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<PublicShell />}>
        <Route path="/" element={<Landing />} />
        <Route path="/events" element={<Events />} />
        <Route path="/creators" element={<Creators />} />
        <Route
          path="/creators/:id/checkout"
          element={
            <React.Suspense fallback={<PageFallback title="Loading checkout…" />}>
              <CreatorCheckout />
            </React.Suspense>
          }
        />
        <Route
          path="/creators/:id/subscribed"
          element={
            <React.Suspense fallback={<PageFallback title="Loading…" />}>
              <CreatorSubscribed />
            </React.Suspense>
          }
        />
        <Route path="/creators/:id" element={<CreatorDetail />} />
        <Route path="/odds" element={<OddsIntel />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/trust/verification" element={<TrustVerificationPage />} />
        <Route path="/trust/results-methodology" element={<ResultsMethodologyPage />} />
        <Route path="/trust/disputes" element={<TrustDisputesPage />} />
        <Route path="/responsible-betting" element={<ResponsibleBettingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/press" element={<PressPage />} />
        <Route path="/brand" element={<BrandPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/legal/terms" element={<TermsPage />} />
        <Route path="/legal/privacy" element={<PrivacyPage />} />
        <Route path="/legal/refunds" element={<RefundsPage />} />
        <Route path="/legal/age" element={<AgeRestrictionPage />} />
        <Route
          path="/apply"
          element={
            <React.Suspense fallback={<PageFallback title="Loading application…" />}>
              <Apply />
            </React.Suspense>
          }
        />
        <Route
          path="/feed"
          element={
            <AuthGate
              forbiddenTitle="Sign in to follow picks"
              forbiddenSubtitle="Your feed pulls picks from the creators you've subscribed to. Sign in to personalize it."
            >
              <Feed />
            </AuthGate>
          }
        />
        <Route
          path="/saved"
          element={
            <AuthGate
              forbiddenTitle="Sign in to view your library"
              forbiddenSubtitle="Saved picks are tied to your account. Sign in to bookmark and track picks."
            >
              <Saved />
            </AuthGate>
          }
        />
        <Route
          path="/community"
          element={
            <AuthGate
              forbiddenTitle="Sign in to join community channels"
              forbiddenSubtitle="Posting in community rooms requires an account. Sign in to read and reply."
            >
              <Community />
            </AuthGate>
          }
        />
        <Route
          path="/notifications"
          element={
            <AuthGate
              forbiddenTitle="Sign in to view notifications"
              forbiddenSubtitle="Your notification inbox is tied to your account."
            >
              <Notifications />
            </AuthGate>
          }
        />
      </Route>
      <Route
        path="/admin"
        element={
          <React.Suspense fallback={<PageFallback title="Loading admin…" />}>
            <AdminGateLayout />
          </React.Suspense>
        }
      >
        {ADMIN_ROUTE_ENTRIES.map(({ path, Component }) =>
          path ? (
            <Route key={path} path={path} element={<Component />} />
          ) : (
            <Route key="index" index element={<Component />} />
          ),
        )}
      </Route>
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/account/*"
        element={
          <React.Suspense fallback={<PageFallback title="Loading your account…" />}>
            <AccountRoutes />
          </React.Suspense>
        }
      />
      <Route
        path="/dashboard/*"
        element={
          <React.Suspense fallback={<PageFallback title="Loading your studio…" />}>
            <DashboardRoutes />
          </React.Suspense>
        }
      />
    </Routes>
  );
}
