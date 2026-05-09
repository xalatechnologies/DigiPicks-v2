// =============================================================================
// Focus trap + restore for dialog-style components (Modal, Drawer).
// WCAG 2.4.3 — focus order must remain inside an open dialog.
// =============================================================================

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  'iframe',
  'summary',
].join(',');

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('inert') && el.offsetParent !== null,
  );
}

/**
 * Activate a focus trap inside `dialog`. Returns a cleanup function that
 * removes the listener and restores focus to wherever it was before the
 * trap was activated. Safe to call from inside a `useEffect` cleanup.
 */
export function activateFocusTrap(dialog: HTMLElement): () => void {
  const previouslyFocused =
    (typeof document !== 'undefined' && (document.activeElement as HTMLElement | null)) || null;

  // Move focus into the dialog on the next frame so child renders settle first.
  requestAnimationFrame(() => {
    const focusables = getFocusable(dialog);
    if (focusables.length > 0) {
      focusables[0].focus();
    } else if (dialog.tabIndex < 0) {
      dialog.tabIndex = -1;
      dialog.focus();
    } else {
      dialog.focus();
    }
  });

  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const focusables = getFocusable(dialog);
    if (focusables.length === 0) {
      e.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey) {
      if (active === first || !dialog.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  document.addEventListener('keydown', onKeyDown);

  return () => {
    document.removeEventListener('keydown', onKeyDown);
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
  };
}
