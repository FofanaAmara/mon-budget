/** Shared by server and client; only the public invitation landing is allowed. */
export function validInvitationReturn(value: unknown) {
  return typeof value === 'string' && !/\s/.test(value) &&
    /^\/invitation\/[a-f0-9-]{36}\.[A-Za-z0-9_-]{43}$/.test(value)
    ? value
    : null;
}
