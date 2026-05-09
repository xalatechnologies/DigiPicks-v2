import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ConvexReactClient } from 'convex/react';
type AnyConvexClient = React.ComponentProps<typeof ConvexAuthProvider>['client'];
import { ThemeProvider } from '@digipicks/app-shell';
import '@digipicks/ds/styles';
import { App } from './App';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConvexAuthProvider client={convex as unknown as AnyConvexClient}>
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </ConvexAuthProvider>
  </React.StrictMode>,
);
