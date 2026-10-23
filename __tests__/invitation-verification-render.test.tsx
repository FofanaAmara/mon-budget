import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
const state = vi.hoisted(() => ({
  invitation: vi.fn(), request: vi.fn(), verify: vi.fn(),
  session: { data: { user: { id: 'alice' } } as { user: { id: string } } | null, isPending: false, error: null as Error | null },
}));
vi.mock('@/lib/actions/invitations', () => ({ getPublicInvitation: state.invitation }));
vi.mock('@/lib/actions/invitation-verification', () => ({ requestInvitationVerification: state.request, verifyInvitationEmail: state.verify }));
vi.mock('@/lib/auth/client', () => ({ authClient: { useSession: () => state.session } }));
vi.mock('@/components/spaces/InvitationResponse', () => ({ default: () => <button>Accepter l’invitation</button> }));
import InvitationPage from '@/app/invitation/[token]/page';
const token = '11111111-1111-4111-8111-111111111111.' + 'a'.repeat(43);
const invitation = { id: 'invite', spaceName: 'Notre couple', inviterName: 'Alice', status: 'pending', authenticated: true, actorId: 'alice', recipientMatches: true, verified: false };
const render = async () => renderToStaticMarkup(await InvitationPage({ params: Promise.resolve({ token }) }));
beforeEach(() => {
  vi.clearAllMocks();
  state.invitation.mockResolvedValue(invitation);
  state.session = { data: { user: { id: 'alice' } }, isPending: false, error: null };
});
it('offers verification to the matching unverified recipient without sending at render or granting acceptance', async () => {
  const html = await render();
  expect(html).toContain('Recevoir un code de vérification');
  expect(html).toContain('J’ai déjà un code');
  expect(html).not.toContain('Accepter l’invitation');
  expect(state.request).not.toHaveBeenCalled();
  expect(state.verify).not.toHaveBeenCalled();
});
it('keeps wrong accounts and anonymous visitors outside the verification form', async () => {
  state.invitation.mockResolvedValue({ ...invitation, recipientMatches: false });
  expect(await render()).toContain('Changer de compte');
  expect(await render()).not.toContain('Recevoir un code');
  state.invitation.mockResolvedValue({ ...invitation, authenticated: false, actorId: null });
  const html = await render();
  expect(html).toContain('/auth/sign-in?redirectTo=');
  expect(html).toContain('/auth/sign-up?redirectTo=');
  expect(html).not.toContain('Recevoir un code');
});
it('offers explicit acceptance only when the authoritative invitation is verified', async () => {
  state.invitation.mockResolvedValue({ ...invitation, verified: true });
  expect(await render()).toContain('Accepter l’invitation');
  expect(await render()).not.toContain('Recevoir un code');
});
it('hides the code controls while the client session is pending, changed or unavailable', async () => {
  for (const session of [
    { data: null, isPending: true, error: null },
    { data: { user: { id: 'bob' } }, isPending: false, error: null },
    { data: null, isPending: false, error: Error('offline') },
  ]) {
    state.session = session;
    expect(await render()).not.toContain('Recevoir un code');
  }
  expect(state.request).not.toHaveBeenCalled();
});
