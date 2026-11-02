import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const state = vi.hoisted(() => ({
  session: { data: { user: { id: 'alice' } }, isPending: false, error: null } as {
    data: { user: { id: string } } | null; isPending: boolean; error: Error | null;
  },
  spaces: [] as { id: string; name: string; memberCount: number; createdAt: string }[],
  invitations: [] as { id: string }[],
}));
vi.mock('@/lib/auth/client', () => ({ authClient: { useSession: () => state.session, signOut: vi.fn() } }));
vi.mock('@/lib/spaces/context', () => ({ requireIdentity: async () => ({ id: 'alice' }) }));
vi.mock('@/lib/actions/spaces', () => ({ getSpaces: async () => state.spaces }));
vi.mock('@/lib/actions/invitations', () => ({ getReceivedInvitations: async () => ({ invitations: state.invitations }) }));
vi.mock('@/components/spaces/SpaceEntry', () => ({
  FirstSpace: ({ actorKey }: { actorKey: string }) => <p>PRIVATE-DRAFT-{actorKey}</p>,
  ChooseSpace: ({ spaces }: { spaces: typeof state.spaces }) => <p>{spaces[0].name}</p>,
}));
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw Error(`REDIRECT ${path}`); } }));
import Onboarding from '@/app/onboarding/page';
import SpacesChoice from '@/app/espaces/page';
import PrivateInvitationsLayout from '@/app/invitations/layout';

afterEach(() => { state.session = { data: { user: { id: 'alice' } }, isPending: false, error: null }; state.spaces = []; state.invitations = []; });

describe('actual private entry pages bind rendered data to the server actor', () => {
  for (const entry of ['onboarding', 'spaces', 'invitations'] as const) {
    it(`conceals ${entry} when the client account changes, disappears or cannot be checked`, async () => {
      let page;
      let privateText;
      if (entry === 'onboarding') {
        page = await Onboarding(); privateText = 'PRIVATE-DRAFT-alice';
      } else if (entry === 'spaces') {
        state.spaces = [{ id: 'space-a', name: 'PRIVATE-SPACE-ALICE', memberCount: 1, createdAt: '' }];
        page = await SpacesChoice(); privateText = 'PRIVATE-SPACE-ALICE';
      } else {
        page = await PrivateInvitationsLayout({ children: <p>PRIVATE-INVITATION-ALICE</p> });
        privateText = 'PRIVATE-INVITATION-ALICE';
      }
      expect(renderToStaticMarkup(page)).toContain(privateText);
      for (const session of [
        { data: { user: { id: 'bob' } }, isPending: false, error: null },
        { data: null, isPending: false, error: null },
        { data: { user: { id: 'alice' } }, isPending: true, error: null },
        { data: { user: { id: 'alice' } }, isPending: false, error: Error('unavailable') },
      ]) {
        state.session = session;
        const output = renderToStaticMarkup(page);
        expect(output).not.toContain(privateText);
        expect(output).toContain('session');
      }
    });
  }
  it('retains the existing redirect from onboarding once a space exists', async () => {
    state.spaces = [{ id: 'space-a', name: 'Alice', memberCount: 1, createdAt: '' }];
    const page = await Onboarding();
    expect(() => renderToStaticMarkup(page)).toThrow('REDIRECT /espaces');
  });
  it('opens received invitations instead of forcing a first space on a fresh visit', async () => {
    state.invitations = [{ id: 'invitation-a' }];
    const page = await Onboarding();
    expect(() => renderToStaticMarkup(page)).toThrow('REDIRECT /invitations');
  });
});
