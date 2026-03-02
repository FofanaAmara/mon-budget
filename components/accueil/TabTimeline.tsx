'use client';

import { formatCAD } from '@/lib/utils';
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
  paidAt?: string | null;
};

function toDateStr(val: unknown): string {
  if (!val) return '1970-01-01';
  if (typeof val === 'string') return val.split('T')[0];
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val).split('T')[0];
}

// Formats a date string to a human-readable group label
function formatGroupDate(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Parse without TZ shift
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(0, 0, 0, 0);

  if (d.getTime() === today.getTime()) {
    return `Aujourd'hui — ${d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}`;
  }
  if (d.getTime() === yesterday.getTime()) {
    return `Hier — ${d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}`;
  }
  if (d > today) {
    return `À venir — ${d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}`;
  }
  return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' });
}

// Determine if a date is in the future
function isFuture(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(0, 0, 0, 0);
  return d > today;
}

// Icon variant based on event type and status
type IconVariant = 'income-received' | 'expense-paid' | 'charge-upcoming' | 'expense-late' | 'savings' | 'debt-payment' | 'income-upcoming';

function getIconVariant(event: TimelineEvent): IconVariant {
  if (event.type === 'income') {
    return event.status === 'RECEIVED' ? 'income-received' : 'income-upcoming';
  }
  if (event.status === 'OVERDUE') return 'expense-late';
  if (event.status === 'PAID') return 'expense-paid';
  return 'charge-upcoming';
}

const iconStyles: Record<IconVariant, { bg: string; color: string }> = {
  'income-received': { bg: 'var(--success-light)', color: 'var(--positive)' },
  'income-upcoming': { bg: 'var(--teal-50)', color: 'var(--teal-700)' },
  'expense-paid':    { bg: 'var(--teal-50)', color: 'var(--teal-700)' },
  'charge-upcoming': { bg: 'var(--slate-100)', color: 'var(--slate-400)' },
  'expense-late':    { bg: 'var(--error-light)', color: 'var(--error)' },
  'savings':         { bg: '#ECFDF5', color: 'var(--positive)' },
  'debt-payment':    { bg: 'var(--warning-light)', color: 'var(--amber-600)' },
};

// Status badge config
type BadgeVariant = 'received' | 'paid' | 'upcoming' | 'late' | 'expected';
const badgeStyles: Record<BadgeVariant, { bg: string; color: string; label: string }> = {
  received: { bg: 'var(--success-light)', color: 'var(--positive)', label: 'Reçu' },
  paid:     { bg: 'var(--teal-50)', color: 'var(--teal-700)', label: 'Payé' },
  upcoming: { bg: 'var(--slate-100)', color: 'var(--slate-500)', label: 'Prévu' },
  late:     { bg: 'var(--error-light)', color: 'var(--error)', label: 'En retard' },
  expected: { bg: 'var(--slate-100)', color: 'var(--slate-500)', label: 'Attendu' },
};

function getBadgeVariant(event: TimelineEvent): BadgeVariant {
  if (event.type === 'income') {
    return event.status === 'RECEIVED' ? 'received' : 'expected';
  }
  if (event.status === 'OVERDUE') return 'late';
  if (event.status === 'PAID') return 'paid';
  return 'upcoming';
}

// Amount color
function getAmountColor(event: TimelineEvent): string {
  if (event.type === 'income' && event.status === 'RECEIVED') return 'var(--positive)';
  if (event.status === 'OVERDUE') return 'var(--error)';
  if (event.status === 'PAID') return 'var(--slate-900)';
  return 'var(--slate-400)';
}

// Icon SVG by variant
function EventIcon({ variant }: { variant: IconVariant }) {
  const style = iconStyles[variant];
  return (
    <div style={{
      width: '40px', height: '40px',
      borderRadius: 'var(--radius-sm)',
      background: style.bg,
      color: style.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {variant === 'income-received' || variant === 'income-upcoming' ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ) : variant === 'expense-paid' ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : variant === 'expense-late' ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      )}
    </div>
  );
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
      paidAt: e.paid_at,
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

  // Sort: overdue first, then by date desc (today → past → future)
  events.sort((a, b) => {
    if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
    if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1;
    return b.date.localeCompare(a.date);
  });

  // Group by date
  const groups: { date: string; events: TimelineEvent[]; isOverdue?: boolean }[] = [];

  // Separate overdue into its own group
  const overdueEvents = events.filter(e => e.status === 'OVERDUE');
  const normalEvents = events.filter(e => e.status !== 'OVERDUE');

  if (overdueEvents.length > 0) {
    groups.push({ date: '__overdue__', events: overdueEvents, isOverdue: true });
  }

  for (const ev of normalEvents) {
    const last = groups[groups.length - 1];
    if (last && !last.isOverdue && last.date === ev.date) {
      last.events.push(ev);
    } else {
      groups.push({ date: ev.date, events: [ev] });
    }
  }

  if (events.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center', padding: '60px 0',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.5 }}>📅</div>
        <p style={{ color: 'var(--slate-500)', fontSize: '15px', fontWeight: 500 }}>
          Aucun événement ce mois
        </p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '20px', paddingBottom: '8px' }}>
      {groups.map((group) => (
        <div key={group.date} style={{ position: 'relative' }}>
          {/* Date group header */}
          <div style={{
            fontSize: '12px', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: group.isOverdue ? 'var(--error)' : 'var(--slate-400)',
            padding: '16px 0 10px',
            borderBottom: '1px solid var(--slate-100)',
            marginBottom: 0,
          }}>
            {group.isOverdue ? 'En retard' : formatGroupDate(group.date)}
          </div>

          {/* Events */}
          {group.events.map((ev, i) => {
            const variant = getIconVariant(ev);
            const badge = getBadgeVariant(ev);
            const badgeCfg = badgeStyles[badge];
            const amountColor = getAmountColor(ev);
            const isFutureDate = isFuture(ev.date);

            return (
              <div
                key={ev.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 0',
                  borderBottom: i < group.events.length - 1 ? '1px solid var(--slate-100)' : 'none',
                  animation: `fadeInUp 0.4s ease ${0.1 + i * 0.05}s both`,
                }}
              >
                {/* Icon */}
                <EventIcon variant={variant} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px', fontWeight: 600,
                    color: 'var(--slate-900)',
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {ev.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--slate-400)' }}>
                      {ev.type === 'income' ? 'Revenu' : 'Charge'}
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: 700,
                      letterSpacing: '0.04em', textTransform: 'uppercase',
                      padding: '2px 8px', borderRadius: '4px',
                      background: badgeCfg.bg, color: badgeCfg.color,
                    }}>
                      {badgeCfg.label}
                    </span>
                  </div>
                </div>

                {/* Amount + time */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontSize: '15px', fontWeight: 800,
                    letterSpacing: '-0.02em',
                    fontVariantNumeric: 'tabular-nums',
                    color: amountColor,
                  }}>
                    {ev.type === 'income' && ev.status === 'RECEIVED' && '+'}
                    {ev.type === 'expense' && ev.status === 'PAID' && '-'}
                    {formatCAD(ev.amount)}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--slate-400)', marginTop: '2px' }}>
                    {isFutureDate ? 'Prévu' : ev.paidAt ? new Date(ev.paidAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
