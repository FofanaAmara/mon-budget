'use client';

import { authClient } from '@/lib/auth/client';

export default function SignOutButton() {
  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = '/auth/sign-in';
  }

  return (
    <button
      onClick={handleSignOut}
      style={{
        width: '100%',
        marginTop: '32px',
        padding: '14px',
        fontSize: 'var(--text-sm)',
        fontWeight: 600,
        color: '#DC2626',
        background: 'var(--surface-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        cursor: 'pointer',
      }}
    >
      Se deconnecter
    </button>
  );
}
