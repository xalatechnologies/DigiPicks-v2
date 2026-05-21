const ADMIN_PREVIEW_KEY = 'digipicks_dev_admin_preview';

/** QA shell for `/admin` when Convex auth is unavailable (UI only, empty data). */
export function hasDevAdminPreview(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem(ADMIN_PREVIEW_KEY) === '1';
}

export function enableDevAdminPreview(): void {
  sessionStorage.setItem(ADMIN_PREVIEW_KEY, '1');
}

export function clearDevAdminPreview(): void {
  sessionStorage.removeItem(ADMIN_PREVIEW_KEY);
}
