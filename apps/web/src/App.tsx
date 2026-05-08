import React from 'react';
import { Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useConvexAuth, useAuthActions } from '@convex-dev/auth/react';
import {
  PublicLayout,
  Container,
  Row,
  Logo,
  Button,
  ThemeIconButton,
  Footer,
  Input,
  Icon,
  Spacer,
} from '@digipicks/ds';
import { Landing } from './pages/Landing';
import { Events } from './pages/Events';
import { Creators } from './pages/Creators';
import { CreatorDetail } from './pages/CreatorDetail';
import { Apply } from './pages/Apply';
import { Auth } from './pages/Auth';

const NAV_ITEMS: { to: string; label: string }[] = [
  { to: '/', label: 'Home' },
  { to: '/events', label: "Today's Events" },
  { to: '/creators', label: 'Creators' },
];

function AuthHeaderButton() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (isLoading) return null;

  return isAuthenticated ? (
    <Button variant="outline" onClick={() => signOut()}>
      Sign out
    </Button>
  ) : (
    <Button variant="primary" onClick={() => navigate('/auth')}>
      Sign in
    </Button>
  );
}

function PublicHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Container size="xl">
      <Row gap={6}>
        <Logo
          size={36}
          showWord
          onClick={() => navigate('/')}
          aria-label="DigiPicks home"
        />

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
          <ThemeIconButton />
          <Button
            variant="outline"
            iconRight="sparkles"
            onClick={() => navigate('/apply')}
          >
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
        title: 'Get tonight\'s slate in your inbox.',
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
      <Outlet />
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
        <Route path="/apply" element={<Apply />} />
      </Route>
      <Route path="/auth" element={<Auth />} />
    </Routes>
  );
}
