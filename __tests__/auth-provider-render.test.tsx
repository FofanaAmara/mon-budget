import React, { useContext } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';
import { AuthUIContext } from '@neondatabase/auth/react';
import { AuthProviders } from '@/app/providers';

const state = vi.hoisted(() => ({
  push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), invalidate: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useRouter: () => state }));
vi.mock('@/lib/auth/financial-visibility', () => ({ invalidateFinancialViews: state.invalidate }));

beforeEach(() => vi.clearAllMocks());

it('renders the real Auth UI context and notifications without an inline theme script', async () => {
  let context: React.ContextType<typeof AuthUIContext> | undefined;
  function Consumer() {
    context = useContext(AuthUIContext);
    return <main>Private page fallback</main>;
  }
  const html = renderToStaticMarkup(<AuthProviders><Consumer /></AuthProviders>);
  expect(html).toContain('Private page fallback');
  expect(html).toContain('neon-auth-ui');
  expect(html).toContain('aria-label="Notifications alt+T"');
  expect(html).not.toMatch(/<script\b/i);
  expect(context?.hooks.useSession).toBeTypeOf('function');
  expect(context?.credentials?.forgotPassword).toBe(true);
  expect(context?.magicLink).toBe(false);
  expect(context?.twoFactor).toBeUndefined();
  expect(context?.apiKey).toBe(false);
  context?.navigate('/auth/sign-in');
  expect(state.push).toHaveBeenCalledWith('/auth/sign-in');
  await context?.onSessionChange?.();
  expect(state.invalidate).toHaveBeenCalledWith({ notifyCurrent: false });
  expect(state.refresh).toHaveBeenCalledOnce();
});
