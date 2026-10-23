import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  identity: vi.fn(), space: vi.fn(), spaces: vi.fn(), last: vi.fn(), settings: vi.fn(), guide: vi.fn(),
}));
vi.mock('@/lib/spaces/context', () => {
  class SpaceAccessError extends Error {}
  class UnauthenticatedSpaceError extends SpaceAccessError {}
  class SpacesUnavailableError extends Error {}
  return { SpaceAccessError, UnauthenticatedSpaceError, SpacesUnavailableError, requireIdentity: state.identity, requireSpace: state.space };
});
vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => { throw Error(`REDIRECT:${path}`); }),
  notFound: vi.fn(() => { throw Error('NOT_FOUND'); }),
}));
vi.mock('@/lib/actions/spaces', () => ({ getSpaces: state.spaces, getLastSpace: state.last }));
vi.mock('@/lib/actions/invitations', () => ({ getReceivedInvitations: vi.fn() }));
vi.mock('@/lib/actions/financial/settings', () => ({ getSettings: state.settings }));
vi.mock('@/lib/actions/financial/setup-guide', () => ({ getOrInitSetupGuideData: state.guide }));
vi.mock('@/components/auth/FinancialSessionBoundary', () => ({ default: () => null }));
vi.mock('@/components/spaces/SpaceContext', () => ({ SpaceProvider: () => null }));
vi.mock('@/components/LayoutShell', () => ({ default: () => null }));
import { SpaceAccessError, UnauthenticatedSpaceError, SpacesUnavailableError } from '@/lib/spaces/context';
import { pageSpace, pageSpaceContext, pageIdentity, redirectToLastSpace } from '@/lib/spaces/page';
import FinancialLayout from '@/app/espaces/[spaceId]/layout';

const spaceId = '11111111-1111-4111-8111-111111111111';
beforeEach(() => { vi.clearAllMocks(); state.identity.mockReset(); state.space.mockReset(); });

describe('page authorization translates only authentication and access refusals', () => {
  it('returns the authorized context and requested ID without choosing another space', async () => {
    const context = { userId: 'alice', spaceId, name: 'Private' };
    state.space.mockResolvedValue(context);
    await expect(pageSpaceContext(spaceId)).resolves.toBe(context);
    await expect(pageSpace(Promise.resolve({ spaceId }))).resolves.toBe(spaceId);
    expect(state.last).not.toHaveBeenCalled();
  });
  it('renders a generic not-found for invalid, foreign and inaccessible targets', async () => {
    for (const target of ['invalid', spaceId]) {
      state.space.mockRejectedValue(new SpaceAccessError('forbidden'));
      await expect(pageSpace(Promise.resolve({ spaceId: target }))).rejects.toThrow('NOT_FOUND');
    }
    expect(state.last).not.toHaveBeenCalled();
  });
  it('redirects an absent or expired session to existing sign-in', async () => {
    state.space.mockRejectedValue(new UnauthenticatedSpaceError('sign in'));
    await expect(pageSpace(Promise.resolve({ spaceId }))).rejects.toThrow('REDIRECT:/auth/sign-in');
    state.identity.mockRejectedValue(new UnauthenticatedSpaceError('sign in'));
    await expect(pageIdentity()).rejects.toThrow('REDIRECT:/auth/sign-in');
  });
  it('preserves provider, database and rollout failures instead of denying or logging out', async () => {
    for (const error of [Error('provider unavailable'), Error('database unavailable'), new SpacesUnavailableError('rollout')]) {
      state.space.mockRejectedValue(error);
      state.identity.mockRejectedValue(error);
      await expect(pageSpaceContext(spaceId)).rejects.toBe(error);
      await expect(pageIdentity()).rejects.toBe(error);
    }
  });
  it('checks the layout target before fetching any financial settings or guide', async () => {
    state.space.mockRejectedValue(new SpaceAccessError('forbidden'));
    await expect(FinancialLayout({ params: Promise.resolve({ spaceId }), children: 'secret' })).rejects.toThrow('NOT_FOUND');
    expect(state.spaces).not.toHaveBeenCalled();
    expect(state.settings).not.toHaveBeenCalled();
    expect(state.guide).not.toHaveBeenCalled();
  });
  it('checks authentication before root preference or invitation reads', async () => {
    state.identity.mockRejectedValue(new UnauthenticatedSpaceError('expired'));
    await expect(redirectToLastSpace('/depenses')).rejects.toThrow('REDIRECT:/auth/sign-in');
    expect(state.last).not.toHaveBeenCalled();
    expect(state.spaces).not.toHaveBeenCalled();
  });
});
