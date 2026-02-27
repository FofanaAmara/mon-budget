'use client';

import { useRouter } from 'next/navigation';
import { monthLabel, prevMonth, nextMonth, currentMonthKey } from '@/lib/month-utils';

type Props = {
  month: string;
  basePath: string;
};

export default function MonthNavigator({ month, basePath }: Props) {
  const router = useRouter();
  const today = currentMonthKey();
  const isCurrentMonth = month === today;

  function navigateMonth(target: string) {
    const sep = basePath.includes('?') ? '&' : '?';
    router.push(`${basePath}${sep}month=${target}`);
  }

  return (
    <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
      <button
        onClick={() => navigateMonth(prevMonth(month))}
        style={{
          padding: '8px', color: 'var(--text-tertiary)',
          borderRadius: 'var(--radius-md)',
          transition: `all var(--duration-fast) var(--ease-out)`,
          background: 'none', border: 'none', cursor: 'pointer',
        }}
        aria-label="Mois précédent"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <div className="text-center">
        <h1 style={{
          fontSize: 'var(--text-lg)', fontWeight: 750,
          color: 'var(--text-primary)',
          textTransform: 'capitalize' as const,
          letterSpacing: 'var(--tracking-tight)',
        }}>
          {monthLabel(month)}
        </h1>
        {!isCurrentMonth && (
          <button
            onClick={() => navigateMonth(today)}
            style={{
              fontSize: 'var(--text-xs)', color: 'var(--accent)',
              marginTop: '4px', background: 'none', border: 'none',
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            Retour au mois actuel
          </button>
        )}
      </div>

      <button
        onClick={() => navigateMonth(nextMonth(month))}
        style={{
          padding: '8px',
          color: month >= today ? 'var(--border-default)' : 'var(--text-tertiary)',
          borderRadius: 'var(--radius-md)',
          transition: `all var(--duration-fast) var(--ease-out)`,
          background: 'none', border: 'none',
          cursor: month >= today ? 'default' : 'pointer',
        }}
        aria-label="Mois suivant"
        disabled={month >= today}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
