import { AdminSupportHub } from './Support';

/** Pick dispute queue — filtered view of the unified support hub. */
export function DisputeQueue() {
  return <AdminSupportHub presetQueue="pick" title="Pick dispute queue" />;
}
