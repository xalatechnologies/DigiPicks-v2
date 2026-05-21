import React from 'react';
import { Button, Container, EmptyState, Section, Stack } from '@digipicks/ds';

export interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  title?: string;
}

interface State {
  error: Error | null;
}

function formatErrorMessage(error: Error): string {
  const msg = error.message;
  if (msg.includes('Could not find public function')) {
    return `${msg} Run \`npx convex dev\` in the project root (or point .env.local at a deployment that has the latest functions).`;
  }
  if (msg.includes('Unauthorized')) {
    return 'Your session is still loading or has expired. Wait a moment, sign in again at /auth, or reload the page.';
  }
  return msg;
}

/**
 * Catches render/query errors so a single bad Convex call does not blank the whole app.
 */
export class RouteErrorBoundary extends React.Component<RouteErrorBoundaryProps, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main>
          <Container size="xl">
            <Section noReveal>
              <Stack gap={4}>
                <EmptyState
                  icon="shield"
                  title={this.props.title ?? 'Something went wrong'}
                  subtitle={formatErrorMessage(this.state.error)}
                />
                <Button variant="primary" onClick={() => window.location.reload()}>
                  Reload page
                </Button>
              </Stack>
            </Section>
          </Container>
        </main>
      );
    }
    return this.props.children;
  }
}
