import { defineApp } from 'convex/server';
import rateLimiter from '@convex-dev/rate-limiter/convex.config';

// =============================================================================
// Convex App configuration — register installed components.
// Components add their own functions to the deployment under a namespace
// (here: `components.rateLimiter`).
// =============================================================================

const app = defineApp();

app.use(rateLimiter);

export default app;
