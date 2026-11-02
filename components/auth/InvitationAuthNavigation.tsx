"use client";

import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';
import Link from 'next/link';
import { invitationAuthHref } from '@/lib/invitations/return-path';

// Scoped to the rendered Auth page, so a previous invitation cannot leak into
// another page through browser globals or provider state.
const InvitationReturnContext = createContext<string | undefined>(undefined);

export function InvitationAuthNavigation({ returnTo, children }: {
  returnTo: string;
  children: ReactNode;
}) {
  return <InvitationReturnContext.Provider value={returnTo}>{children}</InvitationReturnContext.Provider>;
}

export function InvitationAuthLink({ href, ...props }: ComponentProps<typeof Link>) {
  const returnTo = useContext(InvitationReturnContext);
  return <Link {...props} href={typeof href === 'string' ? invitationAuthHref(href, returnTo) : href} />;
}
