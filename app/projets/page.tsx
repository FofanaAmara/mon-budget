import { getPlannedExpenses } from '@/lib/actions/expenses';
import ProjetsClient from '@/components/ProjetsClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProjetsPage() {
  const projets = await getPlannedExpenses();

  return (
    <div style={{ padding: '36px 20px 24px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 750,
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
        }}>
          Projets
        </h1>
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          marginTop: '4px',
          fontWeight: 500,
        }}>
          Suivez vos objectifs d&apos;epargne
        </p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <Link
          href="/depenses"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 'var(--text-sm)',
            color: 'var(--accent)',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span style={{ fontSize: 'var(--text-base)', fontWeight: 700 }}>+</span>
          Ajouter un projet depuis Depenses
        </Link>
      </div>

      <ProjetsClient projets={projets} />
    </div>
  );
}
