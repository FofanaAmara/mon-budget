'use client';

import { formatCAD, formatShortDate } from '@/lib/utils';
import { STATUS_STYLES, STATUS_LABELS } from '@/lib/constants';
import type { MonthlyExpense, MonthlyIncome } from '@/lib/types';

type Props = {
  expenses: MonthlyExpense[];
  monthlyIncomes: MonthlyIncome[];
};

type TimelineEvent = {
  id: string;
  date: string;
  name: string;
  amount: number;
  type: 'expense' | 'income';
  status: string;
};

function toDateStr(val: unknown): string {
  if (!val) return '1970-01-01';
  if (typeof val === 'string') return val.split('T')[0];
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val).split('T')[0];
}

export default function TabTimeline({ expenses, monthlyIncomes }: Props) {
  // Build unified timeline
  const events: TimelineEvent[] = [];

  for (const e of expenses) {
    events.push({
      id: e.id,
      date: toDateStr(e.due_date),
      name: e.name,
      amount: Number(e.amount),
      type: 'expense',
      status: e.status,
    });
  }

  for (const mi of monthlyIncomes) {
    events.push({
      id: mi.id,
      date: toDateStr(mi.received_at ?? mi.created_at),
      name: mi.income_name ?? 'Revenu',
      amount: Number(mi.actual_amount ?? mi.expected_amount ?? 0),
      type: 'income',
      status: mi.status,
    });
  }

  // Sort by date
  events.sort((a, b) => b.date.localeCompare(a.date));

  // Group by date
  const groups: { date: string; events: TimelineEvent[] }[] = [];
  for (const ev of events) {
    const last = groups[groups.length - 1];
    if (last && last.date === ev.date) {
      last.events.push(ev);
    } else {
      groups.push({ date: ev.date, events: [ev] });
    }
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ padding: '60px 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.6 }}>📅</div>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
          Aucun evenement ce mois
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {groups.map((group) => (
        <div key={group.date}>
          {/* Date header */}
          <div style={{
            fontSize: 'var(--text-xs)', fontWeight: 650,
            color: 'var(--text-tertiary)', textTransform: 'uppercase',
            letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '4px',
          }}>
            {formatShortDate(group.date)}
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {group.events.map((ev, i) => {
              const isIncome = ev.type === 'income';
              const statusStyle = isIncome ? null : STATUS_STYLES[ev.status as keyof typeof STATUS_STYLES];

              return (
                <div key={ev.id}>
                  {i > 0 && <div className="divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
                  <div className="flex items-center" style={{ gap: '12px', padding: '12px 20px' }}>
                    {/* Indicator */}
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                      background: isIncome ? 'var(--positive)' : (statusStyle?.color ?? 'var(--accent)'),
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-sm)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {ev.name}
                      </p>
                      <span style={{
                        fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '999px',
                        background: isIncome ? 'var(--positive-subtle)' : (statusStyle?.bg ?? 'var(--surface-sunken)'),
                        color: isIncome ? 'var(--positive-text)' : (statusStyle?.color ?? 'var(--text-tertiary)'),
                      }}>
                        {isIncome ? (ev.status === 'RECEIVED' ? 'Reçu' : 'Attendu') : STATUS_LABELS[ev.status as keyof typeof STATUS_LABELS]}
                      </span>
                    </div>
                    <span className="amount" style={{
                      fontSize: 'var(--text-sm)', flexShrink: 0,
                      color: isIncome ? 'var(--positive)' : 'var(--text-primary)',
                    }}>
                      {isIncome ? '+' : '-'}{formatCAD(ev.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
