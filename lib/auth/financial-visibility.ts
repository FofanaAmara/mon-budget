/** A lock only hides private views. Only a fresh document can clear it. */
export const FINANCIAL_SESSION_STORAGE = 'mes-finances:session-generation';
export type VisibilityLock = 'session' | 'offline' | 'history' | 'signout-error';

export function createVisibilityController(target: EventTarget, online: () => boolean) {
  let reason: VisibilityLock | null = null;
  const listeners = new Set<() => void>();
  function lock(next: VisibilityLock) {
    if (reason === next) return;
    reason = next;
    for (const listener of listeners) listener();
  }
  const handlers: Record<string, EventListener> = {
    storage: event => {
      if ((event as StorageEvent).key === FINANCIAL_SESSION_STORAGE) lock('session');
    },
    offline: () => lock('offline'),
    pagehide: () => lock('history'),
    pageshow: event => {
      if ((event as PageTransitionEvent).persisted) lock('history');
    },
  };
  return {
    lock,
    snapshot: () => reason ?? (online() ? null : 'offline'),
    subscribe(listener: () => void) {
      if (!listeners.size) {
        for (const [event, handler] of Object.entries(handlers)) target.addEventListener(event, handler);
      }
      listeners.add(listener);
      if (!online()) lock('offline');
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          for (const [event, handler] of Object.entries(handlers)) target.removeEventListener(event, handler);
        }
      };
    },
  };
}
let controller: ReturnType<typeof createVisibilityController> | undefined;
function browserController() {
  controller ??= createVisibilityController(window, () => navigator.onLine);
  return controller;
}
export const subscribeFinancialVisibility = (listener: () => void) => browserController().subscribe(listener);
export const financialVisibilitySnapshot = () => browserController().snapshot();
export const serverVisibilitySnapshot = () => null;
export function lockFinancialViews(reason: VisibilityLock) {
  browserController().lock(reason);
}

/** No identity, token or financial value is persisted or sent between tabs. */
export function invalidateFinancialViews({ notifyCurrent = true } = {}) {
  if (notifyCurrent) lockFinancialViews('session');
  try {
    window.localStorage.setItem(FINANCIAL_SESSION_STORAGE, crypto.randomUUID());
  } catch {
    // Storage can be unavailable. The current view stays locked; the session
    // comparison and focus refetch still protect views when they resume.
  }
}

/** Expiration is enforced even if an open tab never receives another focus. */
export function watchSessionExpiry(expiresAt: Date | string | undefined, expire: () => void) {
  const deadline = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt ?? '').getTime();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  function check() {
    if (stopped) return;
    const remaining = deadline - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) {
      expire();
      return;
    }
    timer = setTimeout(check, Math.min(remaining, 2_147_483_647));
  }
  check();
  return () => { stopped = true; clearTimeout(timer); };
}
