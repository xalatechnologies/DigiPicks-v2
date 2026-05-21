import { AdminSupportHub } from './Support';

/** Billing cases and refunds — filtered view of the unified support hub. */
export function Refunds() {
  return (
    <AdminSupportHub
      presetQueue="billing"
      title="Refunds & billing cases"
      sub="Billing cases, chargebacks, and subscription refunds."
    />
  );
}
