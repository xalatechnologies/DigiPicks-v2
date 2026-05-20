import { useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

export function useStripePortal() {
  const createPortal = useAction(api.stripe.createCustomerPortalSession);

  async function openPortal(returnPath?: string) {
    const { url } = await createPortal({ returnPath });
    window.location.assign(url);
  }

  return { openPortal };
}
