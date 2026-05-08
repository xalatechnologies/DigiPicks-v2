import React from 'react';
import { ConvexProvider as BaseConvexProvider, ConvexReactClient } from 'convex/react';

// =============================================================================
// Convex Provider — Wraps ConvexReactClient for the app
// =============================================================================

const convexUrl = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_CONVEX_URL ?? '';

let client: ConvexReactClient | null = null;

function getClient(): ConvexReactClient {
  if (!client) {
    if (!convexUrl) {
      throw new Error('VITE_CONVEX_URL is not set. Run `npx convex dev` to get your URL.');
    }
    client = new ConvexReactClient(convexUrl);
  }
  return client;
}

export const ConvexProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <BaseConvexProvider client={getClient()}>{children}</BaseConvexProvider>;
};
