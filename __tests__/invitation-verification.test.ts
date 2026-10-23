import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ identity: vi.fn(), ready: vi.fn(), sql: vi.fn(), send: vi.fn(), verify: vi.fn() }));
vi.mock('@/lib/auth/server', () => ({ auth: { emailOtp: { sendVerificationOtp: state.send, verifyEmail: state.verify } } }));
vi.mock('@/lib/spaces/context', () => {
  class SpaceAccessError extends Error {}
  return { requireIdentity: state.identity, requireSpacesReady: state.ready, SpaceAccessError };
});
vi.mock('@/lib/db', () => ({ sql: state.sql }));
import { requestInvitationVerification, verifyInvitationEmail } from '@/lib/actions/invitation-verification';

const token = '11111111-1111-4111-8111-111111111111.' + 'a'.repeat(43);
const actor = { id: 'alice', email: 'alice@example.test', emailVerified: false };
const input = { token, expectedActorId: actor.id };
beforeEach(() => {
  vi.resetAllMocks();
  state.identity.mockResolvedValue(actor);
  state.sql.mockResolvedValue([{ id: 'invitation' }]);
  state.send.mockResolvedValue({ data: { success: true }, error: null });
  state.verify.mockResolvedValue({ data: { status: true, token: 'never-return-this' }, error: null });
});

describe('invitation email verification without changing membership or trusting client addresses', () => {
  it('derives the recipient from fresh Auth and asks Neon for email verification, never sign-in', async () => {
    expect(await requestInvitationVerification(input)).toEqual({ ok: true, status: 'sent' });
    expect(state.identity).toHaveBeenCalledWith({ fresh: true });
    expect(state.send).toHaveBeenCalledExactlyOnceWith({ email: actor.email, type: 'email-verification' });
    expect(state.sql.mock.calls[0].slice(1)).toContain(actor.email);
    expect(state.sql.mock.calls[0].slice(1)).not.toContain(token);
  });
  it('refuses missing, changed or mismatching actors before provider delivery', async () => {
    for (const expectedActorId of ['', 'bob']) {
      expect(await requestInvitationVerification({ ...input, expectedActorId })).toMatchObject({ ok: false });
    }
    state.identity.mockRejectedValue(Error('provider-unavailable-with-private-data'));
    const result = await requestInvitationVerification(input);
    expect(result).toMatchObject({ ok: false });
    expect(JSON.stringify(result)).not.toContain('private-data');
    expect(state.send).not.toHaveBeenCalled();
  });
  it('refuses malformed tokens, expired/foreign/answered invitations before both endpoints', async () => {
    expect(await requestInvitationVerification({ ...input, token: 'invalid' })).toMatchObject({ ok: false });
    state.sql.mockResolvedValue([]);
    expect(await requestInvitationVerification(input)).toMatchObject({ ok: false });
    expect(await verifyInvitationEmail({ ...input, code: '123456' })).toMatchObject({ ok: false });
    expect(state.send).not.toHaveBeenCalled();
    expect(state.verify).not.toHaveBeenCalled();
  });
  it('does not send to an arbitrary client email and does not re-send for an already verified account', async () => {
    await requestInvitationVerification({ ...input, email: 'victim@example.test' } as typeof input);
    expect(state.send.mock.calls[0][0].email).toBe(actor.email);
    state.send.mockClear();
    state.identity.mockResolvedValue({ ...actor, emailVerified: true });
    expect(await requestInvitationVerification(input)).toEqual({ ok: true, status: 'verified' });
    expect(state.send).not.toHaveBeenCalled();
  });
  it('does not announce success for a provider failure or an ambiguous response', async () => {
    for (const result of [{ error: { code: 'TOO_MANY_REQUESTS', message: 'private' } }, { data: null, error: null }]) {
      state.send.mockResolvedValue(result);
      const answer = await requestInvitationVerification(input);
      expect(answer).toMatchObject({ ok: false });
      expect(JSON.stringify(answer)).not.toContain('private');
    }
    state.send.mockRejectedValue(Error('network-private'));
    expect(await requestInvitationVerification(input)).toMatchObject({ ok: false });
    expect(state.send).toHaveBeenCalledTimes(3);
  });
  it('rejects malformed codes before calling the provider', async () => {
    for (const code of ['', '123', 'abc123', '1'.repeat(13)]) {
      expect(await verifyInvitationEmail({ ...input, code })).toMatchObject({ ok: false });
    }
    expect(state.verify).not.toHaveBeenCalled();
  });
  it('only confirms success after a fresh verified session for the same actor, never returns provider tokens', async () => {
    state.identity.mockResolvedValueOnce(actor).mockResolvedValueOnce({ ...actor, emailVerified: true });
    expect(await verifyInvitationEmail({ ...input, code: '123456' })).toEqual({ ok: true, status: 'verified' });
    expect(state.verify).toHaveBeenCalledExactlyOnceWith({ email: actor.email, otp: '123456' });
    expect(state.identity).toHaveBeenCalledTimes(2);
    expect(state.identity.mock.calls.every(([options]) => options.fresh === true)).toBe(true);
  });
  it('keeps the invitation pending when the provider rejects or does not confirm verification', async () => {
    for (const result of [{ error: { code: 'INVALID_OTP' } }, { data: { status: false }, error: null }]) {
      state.verify.mockResolvedValue(result);
      expect(await verifyInvitationEmail({ ...input, code: '123456' })).toMatchObject({ ok: false });
    }
    state.verify.mockResolvedValue({ data: { status: true }, error: null });
    for (const next of [{ ...actor, emailVerified: false }, { ...actor, id: 'bob', emailVerified: true }]) {
      state.identity.mockReset().mockResolvedValueOnce(actor).mockResolvedValueOnce(next);
      expect(await verifyInvitationEmail({ ...input, code: '123456' })).toMatchObject({ ok: false });
    }
    expect(state.sql.mock.calls.every(([query]) => query.join('').trim().startsWith('SELECT'))).toBe(true);
  });
});
