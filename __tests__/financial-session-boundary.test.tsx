import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  createVisibilityController,
  FINANCIAL_SESSION_STORAGE,
  watchSessionExpiry,
} from '@/lib/auth/financial-visibility';

const state = vi.hoisted(() => ({
  session: { data: { user: { id: 'alice' } } as { user: { id: string } } | null, isPending: false, error: null as Error | null },
  signOut: vi.fn(),
}));
vi.mock('@/lib/auth/client', () => ({ authClient: { useSession: () => state.session, signOut: state.signOut } }));
vi.mock('@neondatabase/auth/react', () => ({ AuthView: () => <div>SDK-AUTH-VIEW</div> }));
import AuthPage from '@/app/auth/[path]/page';
import FinancialSessionBoundary from '@/components/auth/FinancialSessionBoundary';
import { signOutAndClear } from '@/lib/auth/sign-out';

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); state.session = { data: { user: { id: 'alice' } }, isPending: false, error: null }; });
const render = () => renderToStaticMarkup(<FinancialSessionBoundary userId="alice">FINANCES-PRIVÉES-1450.00</FinancialSessionBoundary>);

describe('financial session rendering', () => {
  it('renders private children only for the exact settled session', () => {
    expect(render()).toContain('FINANCES-PRIVÉES-1450.00');
    for (const session of [
      { data: { user: { id: 'bob' } }, isPending: false, error: null },
      { data: null, isPending: false, error: null },
      { data: { user: { id: 'alice' } }, isPending: true, error: null },
      { data: { user: { id: 'alice' } }, isPending: false, error: Error('offline') },
    ]) {
      state.session = session;
      expect(render()).not.toContain('FINANCES-PRIVÉES-1450.00');
      expect(render()).toMatch(/session/);
    }
  });
});
describe('private view invalidation controller', () => {
  it('locks on local invalidation, cross-tab invalidation, offline and browser history', () => {
    for (const [name, fields, reason] of [
      ['storage', { key: FINANCIAL_SESSION_STORAGE }, 'session'],
      ['offline', {}, 'offline'],
      ['pagehide', {}, 'history'],
      ['pageshow', { persisted: true }, 'history'],
    ] as const) {
      const target = new EventTarget();
      const controller = createVisibilityController(target, () => true);
      const notify = vi.fn();
      const stop = controller.subscribe(notify);
      const event = new Event(name); Object.assign(event, fields); target.dispatchEvent(event);
      expect(controller.snapshot()).toBe(reason);
      expect(notify).toHaveBeenCalledOnce();
      target.dispatchEvent(new Event('online'));
      expect(controller.snapshot()).toBe(reason);
      stop();
    }
  });
  it('does not let unrelated storage changes or an ordinary pageshow destroy a draft', () => {
    const target = new EventTarget();
    const controller = createVisibilityController(target, () => true);
    const stop = controller.subscribe(vi.fn());
    const event = new Event('storage');Object.assign(event, { key: 'unrelated' });target.dispatchEvent(event);
    target.dispatchEvent(new Event('pageshow'));
    expect(controller.snapshot()).toBeNull();stop();
  });
  it('keeps an initial offline state locked after reconnection until a new document', () => {
    let online = false;
    const target = new EventTarget();
    const controller = createVisibilityController(target, () => online);
    expect(controller.snapshot()).toBe('offline');
    const stop = controller.subscribe(vi.fn());
    online = true; target.dispatchEvent(new Event('online'));
    expect(controller.snapshot()).toBe('offline');stop();
  });
  it('shares listeners, removes them after the last unmount, and retains the lock', () => {
    const target = new EventTarget();const add = vi.spyOn(target, 'addEventListener'), remove = vi.spyOn(target, 'removeEventListener');
    const controller = createVisibilityController(target, () => true);
    const a = vi.fn(), b = vi.fn();const stopA = controller.subscribe(a), stopB = controller.subscribe(b);
    expect(add).toHaveBeenCalledTimes(4);
    target.dispatchEvent(new Event('offline'));stopA();expect(remove).not.toHaveBeenCalled();
    controller.lock('session');expect(a).toHaveBeenCalledTimes(1);expect(b).toHaveBeenCalledTimes(2);
    stopB();expect(remove).toHaveBeenCalledTimes(4);
    controller.subscribe(vi.fn())();expect(controller.snapshot()).toBe('session');
  });
});
describe('sign-out sequencing', () => {
  it('routes the actual sign-out page through the controlled view while keeping other Auth views', async () => {
    const before = state.signOut.mock.calls.length;
    const page = await AuthPage({ params: Promise.resolve({ path: 'sign-out' }), searchParams: Promise.resolve({}) });
    const output = renderToStaticMarkup(page);
    expect(output).toContain('Déconnexion en cours');
    expect(output).not.toContain('SDK-AUTH-VIEW');
    expect(state.signOut.mock.calls.length).toBe(before);
    const signIn = await AuthPage({ params: Promise.resolve({ path: 'sign-in' }), searchParams: Promise.resolve({}) });
    expect(renderToStaticMarkup(signIn)).toContain('SDK-AUTH-VIEW');
  });
  it('locks before the network settles and still locks when storage is unavailable', async () => {
    const replace = vi.fn(), storage = vi.fn(() => { throw Error('Storage unavailable'); });
    vi.stubGlobal('window', Object.assign(new EventTarget(), { localStorage: { setItem: storage }, location: { replace } }));
    vi.stubGlobal('navigator', { onLine: true });
    let resolve!: (result: { error: null }) => void;
    state.signOut.mockImplementation(() => new Promise(done => { resolve = done; }));
    const { financialVisibilitySnapshot } = await import('@/lib/auth/financial-visibility');
    const pending = signOutAndClear();
    expect(financialVisibilitySnapshot()).toBe('session');
    expect(storage).toHaveBeenCalled();expect(replace).not.toHaveBeenCalled();
    resolve({ error: null });await expect(pending).resolves.toBe(true);
    expect(replace).toHaveBeenCalledWith('/auth/sign-in');
  });
  it('does not report success or redirect when the server rejects sign-out', async () => {
    const replace = vi.fn();
    vi.stubGlobal('window', Object.assign(new EventTarget(), { localStorage: { setItem: vi.fn() }, location: { replace } }));
    vi.stubGlobal('navigator', { onLine: true });
    state.signOut.mockResolvedValue({ error: { message: 'rejected' } });
    await expect(signOutAndClear()).resolves.toBe(false);expect(replace).not.toHaveBeenCalled();
    const { financialVisibilitySnapshot } = await import('@/lib/auth/financial-visibility');
    expect(financialVisibilitySnapshot()).toBe('signout-error');
  });
  it('preserves only a bounded invitation return and suppresses stale navigation', async () => {
    const replace = vi.fn();
    vi.stubGlobal('window', Object.assign(new EventTarget(), { localStorage: { setItem: vi.fn() }, location: { replace } }));
    vi.stubGlobal('navigator', { onLine: true });
    state.signOut.mockResolvedValue({ error: null });
    const invitation = '/invitation/00000000-0000-4000-8000-000000000001.' + 'a'.repeat(43);
    await signOutAndClear({ returnTo: invitation });
    expect(replace).toHaveBeenLastCalledWith(invitation);
    for (const returnTo of ['https://evil.test', '//evil.test', invitation + '?next=evil', invitation + '\n', invitation + '\u2028', ['bad']]) {
      await signOutAndClear({ returnTo });
      expect(replace).toHaveBeenLastCalledWith('/auth/sign-in');
    }
    replace.mockClear();
    await signOutAndClear({ returnTo: invitation, canNavigate: () => false });
    expect(replace).not.toHaveBeenCalled();
    state.signOut.mockResolvedValue({ error: { message: 'denied' } });
    await expect(signOutAndClear({ returnTo: invitation })).resolves.toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

});

describe('session expiration without a focus event', () => {
  it('locks immediately for expired or invalid sessions', () => {
    const expire = vi.fn();
    watchSessionExpiry('2000-01-01', expire)();
    watchSessionExpiry(undefined, expire)();
    expect(expire).toHaveBeenCalledTimes(2);
  });
  it('expires at the deadline and cancels an obsolete session timer', () => {
    vi.useFakeTimers();
    const expire = vi.fn();
    const stop = watchSessionExpiry(new Date(Date.now() + 1000), expire);
    vi.advanceTimersByTime(999);expect(expire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);expect(expire).toHaveBeenCalledOnce();stop();
    const cancel = watchSessionExpiry(new Date(Date.now() + 1000), expire);
    cancel();vi.advanceTimersByTime(1000);expect(expire).toHaveBeenCalledOnce();
  });
  it('does not expire a long session when the platform timer limit is reached', () => {
    vi.useFakeTimers();const expire = vi.fn();
    const stop = watchSessionExpiry(new Date(Date.now() + 2_147_483_647 + 1000), expire);
    vi.advanceTimersByTime(2_147_483_647);expect(expire).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);expect(expire).toHaveBeenCalledOnce();stop();
  });
});
