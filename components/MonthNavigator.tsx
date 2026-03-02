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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '0' }}>
      <button
        onClick={() => navigateMonth(prevMonth(month))}
        style={{
          width: '36px', height: '36px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--slate-200)',
          background: 'white',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--slate-500)',
          transition: 'all 0.2s ease',
          flexShrink: 0,
        }}
        aria-label="Mois précédent"
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.borderColor = 'var(--teal-700)';
          el.style.color = 'var(--teal-700)';
          el.style.background = 'var(--teal-50)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.borderColor = 'var(--slate-200)';
          el.style.color = 'var(--slate-500)';
          el.style.background = 'white';
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <div style={{ textAlign: 'center', minWidth: '120px' }}>
        <span style={{
          fontSize: '15px', fontWeight: 700,
          color: 'var(--slate-900)',
          letterSpacing: '-0.01em',
          textTransform: 'capitalize',
        }}>
          {monthLabel(month)}
        </span>
        {!isCurrentMonth && (
          <div>
            <button
              onClick={() => navigateMonth(today)}
              style={{
                fontSize: '11px', color: 'var(--teal-700)',
                marginTop: '2px', background: 'none', border: 'none',
                cursor: 'pointer', fontWeight: 600,
              }}
            >
              Mois actuel
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => navigateMonth(nextMonth(month))}
        style={{
          width: '36px', height: '36px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--slate-200)',
          background: 'white',
          cursor: month >= today ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: month >= today ? 'var(--slate-200)' : 'var(--slate-500)',
          transition: 'all 0.2s ease',
          flexShrink: 0,
          opacity: month >= today ? 0.4 : 1,
        }}
        aria-label="Mois suivant"
        disabled={month >= today}
        onMouseEnter={(e) => {
          if (month < today) {
            const el = e.currentTarget;
            el.style.borderColor = 'var(--teal-700)';
            el.style.color = 'var(--teal-700)';
            el.style.background = 'var(--teal-50)';
          }
        }}
        onMouseLeave={(e) => {
          if (month < today) {
            const el = e.currentTarget;
            el.style.borderColor = 'var(--slate-200)';
            el.style.color = 'var(--slate-500)';
            el.style.background = 'white';
          }
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
