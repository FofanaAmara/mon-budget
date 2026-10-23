import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import AuthPage from '@/app/auth/[path]/page';
import { AuthProviders } from '@/app/providers';
import { invitationAuthHref } from '@/lib/invitations/return-path';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const invitation = `/invitation/00000000-0000-4000-8000-000000000001.${'a'.repeat(43)}`;

async function renderAuth(path: string, redirectTo?: string) {
  const page = await AuthPage({
    params: Promise.resolve({ path }),
    searchParams: Promise.resolve({ redirectTo }),
  });
  return renderToStaticMarkup(<AuthProviders>{page}</AuthProviders>);
}

it('retains the invitation in the real signup footer before hydration', async () => {
  const html = await renderAuth('sign-up', invitation);
  expect(html).toContain(`href="/auth/sign-in?redirectTo=${encodeURIComponent(invitation)}"`);
});

it('retains it in both real signin links before hydration', async () => {
  const html = await renderAuth('sign-in', invitation);
  for (const path of ['sign-up', 'forgot-password']) {
    expect(html).toContain(`href="/auth/${path}?redirectTo=${encodeURIComponent(invitation)}"`);
  }
});

it('does not carry an invitation from a previous render into ordinary Auth', async () => {
  await renderAuth('sign-up', invitation);
  const html = await renderAuth('sign-in');
  expect(html).toContain('href="/auth/sign-up"');
  expect(html).not.toContain(encodeURIComponent(invitation));
});

it.each(['https://evil.example/', '//evil.example/', '/espaces/private', `${invitation}\n`])(
  'rejects an unapproved return in the real Auth page: %s', async (redirectTo) => {
    const html = await renderAuth('sign-up', redirectTo);
    expect(html).toContain('href="/auth/sign-in"');
    expect(html).not.toContain('href="/auth/sign-in?');
  },
);

it('preserves password reset parameters and replaces stale or duplicate returns', () => {
  const href = invitationAuthHref('/auth/reset-password?token=reset-token&redirectTo=bad&redirectTo=worse#form', invitation);
  const url = new URL(href, 'https://app.example');
  expect(url.pathname).toBe('/auth/reset-password');
  expect(url.searchParams.get('token')).toBe('reset-token');
  expect(url.searchParams.getAll('redirectTo')).toEqual([invitation]);
  expect(url.hash).toBe('#form');
  expect(invitationAuthHref(href, '/')).toBe('/auth/reset-password?token=reset-token#form');
});

it.each(['/landing', '/espaces/123', 'https://evil.example/auth/sign-in', '//evil.example/auth/sign-in', '/auth/sign-in/extra']) (
  'does not enrich an unrelated destination: %s', (href) => {
    expect(invitationAuthHref(href, invitation)).toBe(href);
  },
);

it('does not rewrite links outside the Auth page scope', () => {
  const href = '/auth/sign-in?existing=1';
  expect(invitationAuthHref(href, undefined)).toBe(href);
});
