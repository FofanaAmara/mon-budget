/** Shared by server and client; only the public invitation landing is allowed. */
export function validInvitationReturn(value: unknown) {
  return typeof value === 'string' && !/\s/.test(value) &&
    /^\/invitation\/[a-f0-9-]{36}\.[A-Za-z0-9_-]{43}$/.test(value)
    ? value
    : null;
}

const invitationAuthPaths = new Set([
  '/auth/sign-in', '/auth/sign-up', '/auth/forgot-password', '/auth/reset-password',
]);

/** Retain the server-validated return even in Auth links rendered before hydration. */
export function invitationAuthHref(href: string, returnTo: string | undefined) {
  if (returnTo === undefined || !invitationAuthPaths.has(href.split(/[?#]/, 1)[0])) return href;
  const url = new URL(href, 'https://auth-return.invalid');
  const invitation = validInvitationReturn(returnTo);
  if (invitation) url.searchParams.set('redirectTo', invitation);
  else url.searchParams.delete('redirectTo');
  return `${url.pathname}${url.search}${url.hash}`;
}
