const SIGNED_OUT_KEY = 'digipicks_dev_admin_signed_out';

/** User chose Sign out on /admin — block dev auto sign-in until cleared. */
export function hasDevAdminSignedOut(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(SIGNED_OUT_KEY) === '1';
}

export function markDevAdminSignedOut(): void {
  sessionStorage.setItem(SIGNED_OUT_KEY, '1');
}

export function clearDevAdminSignedOut(): void {
  sessionStorage.removeItem(SIGNED_OUT_KEY);
}
