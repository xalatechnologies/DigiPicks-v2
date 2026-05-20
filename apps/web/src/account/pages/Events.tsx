import { Events as EventsPage } from '../../pages/Events';

/** Account shell route — keeps CTAs under `/account/*`. */
export function AccountEvents() {
  return <EventsPage layoutContext="account" />;
}
