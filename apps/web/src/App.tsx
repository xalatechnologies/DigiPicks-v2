import React from 'react';
import { Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useConvexAuth, useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
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
  UserMenu,
  type UserMenuItem,
} from '@digipicks/ds';
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
const OddsIntel = React.lazy(() =>
  import('./pages/OddsIntel').then((m) => ({ default: m.OddsIntel })),
);
const Apply = React.lazy(() => import('./pages/Apply').then((m) => ({ default: m.Apply })));
const Auth = React.lazy(() => import('./pages/Auth').then((m) => ({ default: m.Auth })));
const Feed = React.lazy(() => import('./pages/Feed').then((m) => ({ default: m.Feed })));
const Saved = React.lazy(() => import('./pages/Saved').then((m) => ({ default: m.Saved })));
const Community = React.lazy(() =>
  import('./pages/Community').then((m) => ({ default: m.Community })),
);
const Notifications = React.lazy(() =>
  import('./pages/Notifications').then((m) => ({ default: m.Notifications })),
);
const Admin = React.lazy(() => import('./pages/admin/Admin').then((m) => ({ default: m.Admin })));
const AdminEventReview = React.lazy(() =>
  import('./pages/admin/EventReview').then((m) => ({
    default: m.AdminEventReview,
  })),
);
const AdminDisputeQueue = React.lazy(() =>
  import('./pages/admin/DisputeQueue').then((m) => ({
    default: m.DisputeQueue,
  })),
);
const AdminCoupons = React.lazy(() =>
  import('./pages/admin/Coupons').then((m) => ({ default: m.Coupons })),
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
  { to: '/', label: 'Home' },
  { to: '/events', label: "Today's Events" },
  { to: '/creators', label: 'Creators' },
  { to: '/odds', label: 'Odds' },
];

function AuthHeaderButton() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  // Pull the current user's profile so the UserMenu header shows the
  // right name + email + avatar mono. `'skip'` while unauth.
  const me = useQuery(api.users.meSafe, isAuthenticated ? {} : 'skip');
  // Unread notification count flows into the menu's Notifications row
  // as a trailing badge — surfaces the count without a separate bell.
  const unread = useQuery(api.notifications.unreadCount, isAuthenticated ? {} : 'skip');

  if (isLoading) return null;
  if (!isAuthenticated) {
    return (
      <Button variant="primary" onClick={() => navigate('/auth')}>
        Sign in
      </Button>
    );
  }

  const items: UserMenuItem[] = [
    {
      label: 'My account',
      icon: 'user',
      onClick: () => navigate('/account'),
    },
    {
      label: 'Discover',
      icon: 'compass',
      hint: 'Personalized feed',
      onClick: () => navigate('/account/discover'),
    },
    {
      label: 'My subscriptions',
      icon: 'card',
      onClick: () => navigate('/account/subscriptions'),
    },
    {
      label: 'Saved picks',
      icon: 'bookmark',
      onClick: () => navigate('/account/saved'),
    },
    {
      label: 'Watchlists',
      icon: 'eye',
      onClick: () => navigate('/account/watchlists'),
    },
    {
      label: 'Results',
      icon: 'trophy',
      onClick: () => navigate('/account/results'),
    },
    {
      label: 'Notifications',
      icon: 'bell',
      onClick: () => navigate('/account/notifications'),
      trailing:
        unread && unread > 0 ? (
          <Badge tone="red" dot>
            {unread > 9 ? '9+' : String(unread)}
          </Badge>
        ) : undefined,
    },
    {
      label: 'Messages',
      icon: 'inbox',
      onClick: () => navigate('/account/messages'),
    },
    {
      label: 'Copilot',
      icon: 'sparkles',
      hint: 'Ask anything',
      onClick: () => navigate('/account/copilot'),
    },
    { divider: true },
    {
      label: 'Settings',
      icon: 'gear',
      onClick: () => navigate('/account/settings'),
    },
    {
      label: 'Sign out',
      icon: 'key',
      destructive: true,
      onClick: () => {
        void signOut();
      },
    },
  ];

  return (
    <UserMenu
      user={{
        name: me?.name ?? 'Account',
        email: me?.email ?? undefined,
        mono: me?.name?.charAt(0).toUpperCase(),
      }}
      items={items}
      align="right"
    />
  );
}

function NotificationsBell() {
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();
  const unread = useQuery(api.notifications.unreadCount, isAuthenticated ? {} : 'skip');

  if (!isAuthenticated) return null;

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

  return (
    <Container size="xl">
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
          <Button variant="outline" iconRight="sparkles" onClick={() => navigate('/apply')}>
            Become a creator
          </Button>
          <AuthHeaderButton />
        </Row>
      </Row>
    </Container>
  );
}

function PublicFooter() {
  const columns = [
    {
      title: 'Product',
      items: [
        { label: 'Creators', href: '/creators' },
        { label: "Today's Events", href: '/events' },
        { label: 'Pricing', href: '#' },
        { label: 'Apply', href: '/apply' },
      ],
    },
    {
      title: 'Trust',
      items: [
        { label: 'Verification', href: '#' },
        { label: 'Results methodology', href: '#' },
        { label: 'Disputes', href: '#' },
        { label: 'Responsible betting', href: '#' },
      ],
    },
    {
      title: 'Company',
      items: [
        { label: 'About', href: '#' },
        { label: 'Press', href: '#' },
        { label: 'Brand', href: '#' },
        { label: 'Contact', href: '#' },
      ],
    },
    {
      title: 'Legal',
      items: [
        { label: 'Terms', href: '#' },
        { label: 'Privacy', href: '#' },
        { label: 'Refunds', href: '#' },
        { label: '21+ only', href: '#' },
      ],
    },
  ];

  return (
    <Footer
      brand={<Logo size={32} showWord />}
      tagline="A premium network for verified sports creators and the subscribers who back their edge. Bet responsibly."
      social={[
        { href: '#', label: 'X (Twitter)', icon: <Icon name="message" size={16} /> },
        { href: '#', label: 'Discord', icon: <Icon name="users" size={16} /> },
        { href: '#', label: 'YouTube', icon: <Icon name="play" size={16} /> },
        { href: '#', label: 'Email', icon: <Icon name="inbox" size={16} /> },
      ]}
      newsletter={{
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
      }}
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
        <Route path="/creators/:id" element={<CreatorDetail />} />
        <Route path="/odds" element={<OddsIntel />} />
        <Route
          path="/apply"
          element={
            <AuthGate
              forbiddenTitle="Sign in required"
              forbiddenSubtitle="Creator applications need a verified email account so we can follow up on your submission."
            >
              <Apply />
            </AuthGate>
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
        <Route
          path="/admin"
          element={
            <AuthGate
              allowedRoles={['super_admin', 'tenant_admin', 'admin']}
              forbiddenTitle="Admin access required"
              forbiddenSubtitle="The admin portal is restricted to platform admins."
            >
              <Admin />
            </AuthGate>
          }
        />
        <Route
          path="/admin/events/review"
          element={
            <AuthGate
              allowedRoles={['super_admin', 'tenant_admin', 'admin']}
              forbiddenTitle="Admin access required"
              forbiddenSubtitle="Event review is restricted to platform admins."
            >
              <AdminEventReview />
            </AuthGate>
          }
        />
        <Route
          path="/admin/disputes"
          element={
            <AuthGate
              allowedRoles={['super_admin', 'tenant_admin', 'admin']}
              forbiddenTitle="Admin access required"
              forbiddenSubtitle="The dispute queue is restricted to platform admins."
            >
              <AdminDisputeQueue />
            </AuthGate>
          }
        />
        <Route
          path="/admin/coupons"
          element={
            <AuthGate
              allowedRoles={['super_admin', 'tenant_admin', 'admin']}
              forbiddenTitle="Admin access required"
              forbiddenSubtitle="Promo coupons are restricted to platform admins."
            >
              <AdminCoupons />
            </AuthGate>
          }
        />
      </Route>
      <Route
        path="/auth"
        element={
          <React.Suspense fallback={<PageFallback title="Loading sign in…" />}>
            <Auth />
          </React.Suspense>
        }
      />
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
