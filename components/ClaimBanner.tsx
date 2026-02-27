'use client';

import { useState, useTransition } from 'react';
import { claimOrphanedData } from '@/lib/actions/claim';

export default function ClaimBanner() {
  const [isPending, startTransition] = useTransition();
  const [claimed, setClaimed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || claimed) return null;

  function handleClaim() {
    startTransition(async () => {
      const result = await claimOrphanedData();
      setClaimed(true);
      // Reload to refresh all data with the new user_id
      setTimeout(() => window.location.reload(), 500);
    });
  }

  return (
    <div className="card" style={{
      padding: '16px 20px',
      marginBottom: '16px',
      background: 'var(--accent-light)',
      border: '1px solid var(--accent)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 650,
            color: 'var(--text-primary)',
            marginBottom: '4px',
          }}>
            Donnees existantes detectees
          </p>
          <p style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
          }}>
            Des donnees anterieures a l&apos;activation de l&apos;authentification ont ete trouvees. Voulez-vous les recuperer sur votre compte ?
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <button
        onClick={handleClaim}
        disabled={isPending}
        className="btn-primary"
        style={{
          width: '100%',
          marginTop: '12px',
          padding: '10px',
          fontSize: 'var(--text-sm)',
          opacity: isPending ? 0.5 : 1,
        }}
      >
        {isPending ? 'Recuperation...' : 'Recuperer mes donnees'}
      </button>
    </div>
  );
}
