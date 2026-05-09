// =============================================================================
// VAPID public-key encoding helper. Browsers want the applicationServerKey as
// a Uint8Array; the server hands us URL-safe base64. Single-purpose util,
// kept out of the DS because it has no visual concern.
// =============================================================================

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}
