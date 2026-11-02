'use client';
import { validInvitationReturn } from '../invitations/return-path';
import { authClient } from './client';
import { invalidateFinancialViews, lockFinancialViews } from './financial-visibility';

/** Invalidate private views before awaiting the cookie-changing request. */
export async function signOutAndClear({ returnTo, canNavigate = () => true }: {
  returnTo?: unknown;
  canNavigate?: () => boolean;
} = {}) {
  const destination = returnTo === '/' ? '/' : validInvitationReturn(returnTo) ?? '/auth/sign-in';
  invalidateFinancialViews();
  try {
    const result = await authClient.signOut();
    if (result.error) throw new Error('Sign-out was not confirmed.');
    if (canNavigate()) window.location.replace(destination);
    return true;
  } catch {
    lockFinancialViews('signout-error');
    return false;
  }
}
