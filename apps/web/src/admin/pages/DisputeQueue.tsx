import { AdminSupportHub } from './Support';

/** Pick dispute queue — filtered view of the unified support hub. */
export function DisputeQueue() {
  return (
    <AdminSupportHub
      presetQueue="pick"
      title="Pick dispute queue"
      sub="Review subscriber and creator disputes on graded picks."
    />
  );
}
