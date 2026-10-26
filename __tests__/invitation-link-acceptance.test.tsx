import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
const state = vi.hoisted(() => ({ invitation: vi.fn(), response: vi.fn() }));
vi.mock('@/lib/actions/invitations', () => ({ getPublicInvitation: state.invitation }));
vi.mock('@/components/spaces/InvitationResponse', () => ({ default: (props: unknown) => { state.response(props); return <button>Accepter l’invitation</button>; } }));
import InvitationPage from '@/app/invitation/[token]/page';
const token = '11111111-1111-4111-8111-111111111111.' + 'a'.repeat(43);
const invitation = { id: 'invite', spaceName: 'Notre couple', inviterName: 'Alice', status: 'pending', authenticated: true, actorId: 'alice', recipientMatches: true, verified: false };
const render = async () => renderToStaticMarkup(await InvitationPage({ params: Promise.resolve({ token }) }));
beforeEach(() => { vi.clearAllMocks(); state.invitation.mockResolvedValue(invitation); });
it('offers explicit acceptance from the original mail link without OTP or verified-account requirement', async () => {
  const html = await render();
  expect(html).toContain('Accepter l’invitation');
  expect(html).not.toMatch(/code de vérification|Recevoir un code/);
  expect(state.response).toHaveBeenCalledWith({ id: invitation.id, token });
});
it('keeps wrong accounts and anonymous visitors outside acceptance', async () => {
  state.invitation.mockResolvedValue({ ...invitation, recipientMatches: false });
  expect(await render()).toContain('Changer de compte');
  state.invitation.mockResolvedValue({ ...invitation, authenticated: false, actorId: null });
  const html = await render();
  expect(html).toContain('/auth/sign-in?redirectTo=');
  expect(html).toContain('/auth/sign-up?redirectTo=');
  expect(state.response).not.toHaveBeenCalled();
});
it('keeps acceptance distinct for an already verified recipient too', async () => {
  state.invitation.mockResolvedValue({ ...invitation, verified: true });
  expect(await render()).toContain('Accepter l’invitation');
  expect(state.response).toHaveBeenCalledWith({ id: invitation.id, token });
});
