import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ConvexReactClient } from 'convex/react';
import * as Sentry from '@sentry/react';
type AnyConvexClient = React.ComponentProps<typeof ConvexAuthProvider>['client'];
import { ThemeProvider } from '@digipicks/app-shell';
import { Container, Heading, Muted, Stack } from '@digipicks/ds';
import '@digipicks/ds/styles';
import { App } from './App';
import { I18nProvider } from './lib/i18n';
import { RouteErrorBoundary } from './feedback/RouteErrorBoundary';

// Sentry — opt-in via VITE_SENTRY_DSN. Quiet no-op when unset so dev
// environments don't ship spurious events.
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    // Conservative sample rate — increase per-deploy when investigating.
    tracesSampleRate: 0.1,
    release: import.meta.env.VITE_RELEASE as string | undefined,
  });
}

// Register the push service worker on production-grade origins. Vite's dev
// server serves it from `/sw.js`. The SW registers idempotently — repeated
// calls return the same registration.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

const convexClient = convexUrl
  ? (new ConvexReactClient(convexUrl) as unknown as AnyConvexClient)
  : null;

function MissingConvexConfig() {
  return (
    <main>
      <Container size="md">
        <Stack gap={3}>
          <Heading level={1}>Missing Convex URL</Heading>
          <Muted>
            Set VITE_CONVEX_URL in .env.local (run npx convex dev to create one), then restart the
            Vite dev server.
          </Muted>
        </Stack>
      </Container>
    </main>
  );
}

const Tree = (
  <React.StrictMode>
    <RouteErrorBoundary title="Application error">
      {!convexClient ? (
        <MissingConvexConfig />
      ) : (
        <ConvexAuthProvider client={convexClient}>
          <BrowserRouter>
            <ThemeProvider>
              <I18nProvider>
                <App />
              </I18nProvider>
            </ThemeProvider>
          </BrowserRouter>
        </ConvexAuthProvider>
      )}
    </RouteErrorBoundary>
  </React.StrictMode>
);

const Root = SENTRY_DSN ? (
  <Sentry.ErrorBoundary fallback={<SentryErrorFallback />}>{Tree}</Sentry.ErrorBoundary>
) : (
  Tree
);

function SentryErrorFallback() {
  return (
    <main>
      <Container size="md">
        <Stack gap={3}>
          <Heading level={1}>Something went wrong</Heading>
          <Muted>The team has been notified. Try refreshing the page.</Muted>
        </Stack>
      </Container>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(Root);
