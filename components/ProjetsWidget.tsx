import Link from 'next/link';
import { formatCAD } from '@/lib/utils';
import type { Expense } from '@/lib/types';

type Props = {
  projets: Expense[];
};

export default function ProjetsWidget({ projets }: Props) {
  if (projets.length === 0) return null;

  return (
    <Link href="/projets" className="block card card-press">
      <div style={{ padding: '20px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <span className="section-label">
            Projets
          </span>
          <span style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            fontWeight: 500,
          }}>
            {projets.length} en cours
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {projets.slice(0, 3).map((projet) => {
            const target = Number(projet.target_amount ?? projet.amount);
            const saved = Number(projet.saved_amount ?? 0);
            const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;

            return (
              <div key={projet.id}>
                <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                  <p style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' as const,
                    maxWidth: '160px',
                  }}>
                    {projet.name}
                  </p>
                  <p className="amount" style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}>
                    {formatCAD(saved)} / {formatCAD(target)}
                  </p>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.max(progress, 2)}%`,
                      backgroundColor: progress >= 100 ? 'var(--positive)' : 'var(--accent)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Link>
  );
}
