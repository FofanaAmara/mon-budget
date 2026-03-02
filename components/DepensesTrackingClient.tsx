'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markAsPaid, markAsUpcoming, deleteMonthlyExpense, updateMonthlyExpenseAmount, deferExpenseToMonth } from '@/lib/actions/monthly-expenses';
import { currentMonthKey } from '@/lib/month-utils';
import { GROUP_ORDER, GROUP_LABELS } from '@/lib/constants';
import MonthNavigator from '@/components/MonthNavigator';
import ExpenseTrackingRow from '@/components/ExpenseTrackingRow';
import AdhocExpenseModal from '@/components/AdhocExpenseModal';
import type { MonthlyExpense, MonthSummary, Section, Card } from '@/lib/types';

type Props = {
  expenses: MonthlyExpense[];
  summary: MonthSummary;
  sections: Section[];
  cards: Card[];
  month: string;
};

// Status group accent colors
const STATUS_ACCENT: Record<MonthlyExpense['status'], string> = {
  UPCOMING: 'var(--teal-700)',
  PAID: 'var(--positive)',
  OVERDUE: 'var(--error)',
  DEFERRED: 'var(--amber-500)',
};

// Status group icon background/color
const STATUS_ICON_STYLE: Record<MonthlyExpense['status'], { bg: string; color: string }> = {
  UPCOMING: { bg: 'var(--teal-50)', color: 'var(--teal-700)' },
  PAID: { bg: 'var(--success-light)', color: 'var(--positive)' },
  OVERDUE: { bg: 'var(--error-light)', color: 'var(--error)' },
  DEFERRED: { bg: 'var(--warning-light)', color: 'var(--amber-600)' },
};

// Status group icons (SVG paths)
function StatusGroupIcon({ status }: { status: MonthlyExpense['status'] }) {
  const { color } = STATUS_ICON_STYLE[status];
  if (status === 'UPCOMING') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
  if (status === 'PAID') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
  if (status === 'OVERDUE') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
  // DEFERRED
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}

export default function DepensesTrackingClient({ expenses, summary, sections, cards, month }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'planned' | 'unplanned'>('all');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Expanded groups (all expanded by default)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Action sheets
  const [actionSheet, setActionSheet] = useState<MonthlyExpense | null>(null);
  const [deferSheet, setDeferSheet] = useState<MonthlyExpense | null>(null);
  const [deferTargetMonth, setDeferTargetMonth] = useState('');
  const [editAmountSheet, setEditAmountSheet] = useState<MonthlyExpense | null>(null);
  const [editAmountValue, setEditAmountValue] = useState('');
  const [deleteSheet, setDeleteSheet] = useState<MonthlyExpense | null>(null);
  const [adhocModal, setAdhocModal] = useState(false);

  const today = currentMonthKey();
  const isCurrentMonth = month === today;

  const plannedCount = expenses.filter((e) => e.is_planned).length;
  const unplannedCount = expenses.filter((e) => !e.is_planned).length;

  const filtered = expenses
    .filter((e) => typeFilter === 'all' ? true : typeFilter === 'planned' ? e.is_planned : !e.is_planned)
    .filter((e) => selectedSection ? e.section_id === selectedSection : true);

  const grouped = GROUP_ORDER.map((status) => ({
    status,
    items: filtered.filter((e) => e.status === status),
  })).filter((g) => g.items.length > 0);

  // Monument numbers
  const chargesFixes = summary.planned_total;
  const paidTotal = summary.paid_total;
  const progressPct = chargesFixes > 0 ? Math.min((paidTotal / chargesFixes) * 100, 100) : 0;
  const isOverBudget = paidTotal > chargesFixes && chargesFixes > 0;
  const restAPayer = Math.max(chargesFixes - paidTotal, 0);
  const overAmount = paidTotal - chargesFixes;

  // Generate future months for defer
  function getFutureMonths(fromMonth: string, count = 6): Array<{ key: string; monthLabel: string; yearLabel: string }> {
    const [y, m] = fromMonth.split('-').map(Number);
    const result = [];
    for (let i = 1; i <= count; i++) {
      const d = new Date(y, m - 1 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = new Intl.DateTimeFormat('fr-CA', { month: 'long' }).format(d);
      const yearLabel = String(d.getFullYear());
      result.push({ key, monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1), yearLabel });
    }
    return result;
  }

  function openDeferSheet(expense: MonthlyExpense) {
    const [y, m] = month.split('-').map(Number);
    const next = new Date(y, m, 1);
    const nextKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    setDeferTargetMonth(nextKey);
    setDeferSheet(expense);
    setActionSheet(null);
  }

  function openEditAmountSheet(expense: MonthlyExpense) {
    setEditAmountValue(String(expense.amount ?? ''));
    setEditAmountSheet(expense);
    setActionSheet(null);
  }

  function openDeleteSheet(expense: MonthlyExpense) {
    setDeleteSheet(expense);
    setActionSheet(null);
  }

  function handleToggle(id: string, action: 'paid' | 'upcoming') {
    startTransition(async () => {
      if (action === 'paid') await markAsPaid(id);
      else await markAsUpcoming(id);
      router.refresh();
    });
  }

  function confirmDefer() {
    if (!deferSheet || !deferTargetMonth) return;
    startTransition(async () => {
      await deferExpenseToMonth(deferSheet.id, deferTargetMonth);
      setDeferSheet(null);
      router.refresh();
    });
  }

  function confirmEditAmount() {
    if (!editAmountSheet) return;
    const amt = parseFloat(editAmountValue);
    if (isNaN(amt) || amt < 0) return;
    startTransition(async () => {
      await updateMonthlyExpenseAmount(editAmountSheet.id, amt);
      setEditAmountSheet(null);
      setEditAmountValue('');
      router.refresh();
    });
  }

  function confirmDelete() {
    if (!deleteSheet) return;
    startTransition(async () => {
      await deleteMonthlyExpense(deleteSheet.id);
      setDeleteSheet(null);
      router.refresh();
    });
  }

  function toggleGroup(status: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  // Deferred month label for confirm button
  function getDeferLabel(): string {
    if (!deferTargetMonth) return 'Reporter';
    const months = getFutureMonths(month);
    const found = months.find((m) => m.key === deferTargetMonth);
    return found ? `Reporter vers ${found.monthLabel}` : 'Reporter';
  }

  // Current month label for edit hint
  const currentMonthLabel = (() => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    const label = new Intl.DateTimeFormat('fr-CA', { month: 'long', year: 'numeric' }).format(d);
    return label.charAt(0).toUpperCase() + label.slice(1);
  })();

  const anySheetOpen = !!(actionSheet || deferSheet || editAmountSheet || deleteSheet || adhocModal);

  return (
    <div style={{ padding: '0 0 120px', minHeight: '100vh' }}>
      <MonthNavigator month={month} basePath="/depenses" />

      {/* ====== MONUMENT: dépensé / prévu ====== */}
      <div style={{ padding: '20px 20px 0', textAlign: 'center' }}>
        <p style={{
          fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--teal-700)', marginBottom: '10px',
        }}>
          Dépenses
        </p>

        {/* Amount row: spent / planned */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '6px', lineHeight: 1 }}>
          <span style={{
            fontSize: 'clamp(3rem, 12vw, 5rem)',
            fontWeight: 800, letterSpacing: '-0.04em',
            color: 'var(--slate-900)',
          }}>
            <span style={{ fontSize: '0.4em', fontWeight: 600, color: 'var(--teal-700)', verticalAlign: 'super', marginLeft: '2px' }}>$</span>
            {Math.abs(paidTotal).toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 300, color: 'var(--slate-300)', margin: '0 2px' }}>/</span>
          <span style={{ fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', fontWeight: 600, color: 'var(--slate-400)', letterSpacing: '-0.02em' }}>
            <span style={{ fontSize: '0.6em', fontWeight: 500, color: 'var(--slate-300)', verticalAlign: 'super' }}>$</span>
            {chargesFixes.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* ====== PROGRESS BAR ====== */}
      <div style={{ margin: '16px 20px 0', position: 'relative' }}>
        <div style={{ height: '6px', background: 'var(--slate-100)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
          {isOverBudget ? (
            <>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${(chargesFixes / paidTotal) * 100}%`,
                background: 'var(--teal-700)',
                borderRadius: '3px 0 0 3px',
              }} />
              <div style={{
                position: 'absolute',
                left: `${(chargesFixes / paidTotal) * 100}%`,
                top: 0, bottom: 0,
                width: `${100 - (chargesFixes / paidTotal) * 100}%`,
                background: 'var(--error)',
                borderRadius: '0 3px 3px 0',
              }} />
            </>
          ) : (
            <div style={{
              height: '100%', borderRadius: '3px',
              background: progressPct >= 90 ? 'var(--warning)' : 'var(--teal-700)',
              width: `${progressPct}%`,
              transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              minWidth: progressPct > 0 ? '4px' : '0',
            }} />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--slate-400)', letterSpacing: '-0.01em' }}>
          <span>{Math.round(progressPct)}% dépensé</span>
          <span>{isOverBudget ? `+$${overAmount.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} au-dessus` : `$${restAPayer.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} restant`}</span>
        </div>
      </div>

      {/* ====== STATUS BADGES ====== */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '14px', padding: '0 20px', flexWrap: 'wrap' }}>
        {isOverBudget && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, letterSpacing: '-0.01em', background: 'var(--error-light)', color: 'var(--error)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            +${overAmount.toLocaleString('fr-CA')} au-dessus
          </span>
        )}
        {summary.overdue_count > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, letterSpacing: '-0.01em', background: 'var(--error-light)', color: 'var(--error)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {summary.overdue_count} en retard
          </span>
        )}
        {!isOverBudget && progressPct < 90 && chargesFixes > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, letterSpacing: '-0.01em', background: 'var(--success-light)', color: 'var(--positive)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            ${restAPayer.toLocaleString('fr-CA')} restant
          </span>
        )}
        {summary.total > 0 && summary.unplanned_total > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, letterSpacing: '-0.01em', background: 'var(--warning-light)', color: 'var(--amber-600)' }}>
            ${summary.unplanned_total.toLocaleString('fr-CA')} imprévus
          </span>
        )}
      </div>

      {/* ====== TYPE FILTER TABS ====== */}
      <div style={{
        display: 'flex', gap: '4px',
        background: 'var(--slate-100)',
        borderRadius: 'var(--radius-md)',
        padding: '4px',
        margin: '20px 20px 0',
      }}>
        {([
          { key: 'all' as const, label: 'Tout' },
          { key: 'planned' as const, label: `Charges (${plannedCount})` },
          { key: 'unplanned' as const, label: `Imprévus (${unplannedCount})` },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            style={{
              flex: key === 'all' ? '0 0 auto' : 1,
              padding: '9px 12px',
              whiteSpace: 'nowrap',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 650,
              cursor: 'pointer',
              background: typeFilter === key ? 'var(--white)' : 'transparent',
              color: typeFilter === key ? 'var(--slate-900)' : 'var(--slate-500)',
              border: 'none',
              boxShadow: typeFilter === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              fontFamily: 'var(--font)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ====== SECTION FILTER PILLS ====== */}
      {sections.length > 0 && (
        <div style={{
          display: 'flex', gap: '8px',
          overflowX: 'auto', padding: '14px 20px 4px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}>
          <button
            onClick={() => setSelectedSection(null)}
            style={{
              flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px',
              background: selectedSection === null ? 'var(--teal-700)' : 'var(--white)',
              border: `1px solid ${selectedSection === null ? 'var(--teal-700)' : 'var(--slate-200)'}`,
              borderRadius: '100px',
              fontFamily: 'var(--font)',
              fontSize: '13px', fontWeight: 600,
              color: selectedSection === null ? 'var(--white)' : 'var(--slate-500)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            Tout
          </button>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSection(s.id === selectedSection ? null : s.id)}
              style={{
                flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px',
                background: selectedSection === s.id ? 'var(--teal-700)' : 'var(--white)',
                border: `1px solid ${selectedSection === s.id ? 'var(--teal-700)' : 'var(--slate-200)'}`,
                borderRadius: '100px',
                fontFamily: 'var(--font)',
                fontSize: '13px', fontWeight: 600,
                color: selectedSection === s.id ? 'var(--white)' : 'var(--slate-500)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontSize: '14px', lineHeight: 1 }}>{s.icon}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* ====== EMPTY STATE ====== */}
      {expenses.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.6 }}>📅</div>
          <p style={{ color: 'var(--slate-500)', fontSize: '15px', marginBottom: '8px', fontWeight: 500 }}>
            Aucune dépense ce mois
          </p>
          <p style={{ color: 'var(--slate-400)', fontSize: '13px', opacity: 0.7 }}>
            Les dépenses récurrentes apparaissent automatiquement
          </p>
        </div>
      )}

      {/* ====== GROUPED EXPENSES BY STATUS ====== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 20px 0' }}>
        {grouped.map(({ status, items }) => {
          const isCollapsed = collapsedGroups.has(status);
          const groupTotal = items.reduce((sum, e) => sum + Number(e.amount), 0);
          const accentColor = STATUS_ACCENT[status];
          const iconStyle = STATUS_ICON_STYLE[status];
          const isOverdueGroup = status === 'OVERDUE';

          return (
            <div
              key={status}
              style={{
                background: isOverdueGroup ? 'rgba(220,38,38,0.01)' : 'var(--white)',
                borderRadius: 'var(--radius-lg)',
                border: `1px solid ${isOverdueGroup ? 'rgba(220,38,38,0.12)' : 'var(--slate-200)'}`,
                overflow: 'hidden',
                position: 'relative',
                transition: 'box-shadow 0.25s ease',
              }}
            >
              {/* Left accent bar */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
                background: accentColor,
                borderRadius: '18px 0 0 18px',
              }} />

              {/* Group header */}
              <div
                onClick={() => toggleGroup(status)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px 12px 18px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
                    background: iconStyle.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <StatusGroupIcon status={status} />
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.01em' }}>
                      {GROUP_LABELS[status]}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--slate-400)', marginLeft: '4px' }}>
                      ({items.length})
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--slate-900)', fontVariantNumeric: 'tabular-nums' }}>
                    <span style={{ fontSize: '0.65em', fontWeight: 600, color: 'var(--teal-700)' }}>$</span>
                    {groupTotal.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                  <svg
                    width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="var(--slate-300)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: 'transform 0.25s ease', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </div>
              </div>

              {/* Expense list */}
              {!isCollapsed && (
                <div style={{ borderTop: '1px solid var(--slate-100)' }}>
                  {items.map((expense) => (
                    <ExpenseTrackingRow
                      key={expense.id}
                      expense={expense}
                      isCurrentMonth={isCurrentMonth}
                      onAction={handleToggle}
                      onOpenActions={isCurrentMonth ? () => setActionSheet(expense) : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ====== SUMMARY STATS ====== */}
      {expenses.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '20px 20px 0' }}>
          <div style={{ background: 'var(--white)', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--slate-400)', marginBottom: '6px' }}>
              Payées
            </p>
            <p style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--positive)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              <span style={{ fontSize: '0.55em', fontWeight: 600, color: 'var(--positive)', verticalAlign: 'super' }}>$</span>
              {paidTotal.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--slate-400)', marginTop: '4px' }}>
              {summary.paid_count} dépense{summary.paid_count > 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ background: 'var(--white)', border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--slate-400)', marginBottom: '6px' }}>
              {isOverBudget ? 'Au-dessus' : 'Restant'}
            </p>
            <p style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em', color: isOverBudget ? 'var(--error)' : 'var(--teal-700)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              <span style={{ fontSize: '0.55em', fontWeight: 600, color: 'inherit', verticalAlign: 'super' }}>$</span>
              {isOverBudget
                ? overAmount.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                : restAPayer.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
            <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--slate-400)', marginTop: '4px' }}>
              sur ${chargesFixes.toLocaleString('fr-CA')} prévu
            </p>
          </div>
        </div>
      )}

      {/* ====== FAB — current month only, mobile only ====== */}
      {isCurrentMonth && (
        <button
          onClick={() => setAdhocModal(true)}
          aria-label="Ajouter une dépense imprévue"
          className="fab fab-mobile-only"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {/* ====== BACKDROP ====== */}
      {anySheetOpen && (
        <div
          onClick={() => {
            setActionSheet(null);
            setDeferSheet(null);
            setEditAmountSheet(null);
            setDeleteSheet(null);
            setAdhocModal(false);
          }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 200,
          }}
        />
      )}

      {/* ====== SHEET: ACTION MENU ====== */}
      {actionSheet && (
        <SheetWrapper onClose={() => setActionSheet(null)}>
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--slate-300)' }} />
          </div>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              <div style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', background: actionSheet.section ? '#F0FDFA' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                {actionSheet.section?.icon ?? '💳'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{actionSheet.name}</p>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-400)', marginTop: '2px' }}>
                  {actionSheet.section?.name ?? '—'}{actionSheet.card ? ` · ${actionSheet.card.name}${actionSheet.card.last_four ? ` ****${actionSheet.card.last_four}` : ''}` : ''}
                </p>
              </div>
            </div>
            <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--slate-900)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              <span style={{ fontSize: '0.55em', fontWeight: 600, color: 'var(--teal-700)', verticalAlign: 'super' }}>$</span>
              {Number(actionSheet.amount).toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>

          {/* Action list */}
          <div style={{ padding: '0 12px 8px' }}>
            {/* Mark paid / upcoming */}
            {actionSheet.status !== 'PAID' ? (
              <ActionItem
                iconBg="var(--success-light)" iconColor="var(--positive)"
                title="Marquer payée" desc="Cette dépense est réglée"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
                onClick={() => { handleToggle(actionSheet.id, 'paid'); setActionSheet(null); }}
              />
            ) : (
              <ActionItem
                iconBg="var(--teal-50)" iconColor="var(--teal-700)"
                title="Remettre à venir" desc="Annuler le paiement de cette dépense"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                onClick={() => { handleToggle(actionSheet.id, 'upcoming'); setActionSheet(null); }}
              />
            )}

            {/* Defer */}
            {actionSheet.status !== 'PAID' && actionSheet.status !== 'DEFERRED' && (
              <ActionItem
                iconBg="var(--warning-light)" iconColor="var(--amber-600)"
                title="Reporter à un autre mois" desc="Déplacer vers un mois futur"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg>}
                onClick={() => openDeferSheet(actionSheet)}
                showChevron
              />
            )}

            {/* Edit amount */}
            {actionSheet.status !== 'PAID' && (
              <ActionItem
                iconBg="var(--teal-50)" iconColor="var(--teal-700)"
                title="Modifier le montant" desc="Ajuster pour ce mois uniquement"
                icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}
                onClick={() => openEditAmountSheet(actionSheet)}
                showChevron
              />
            )}

            {/* Delete (adhoc only) */}
            {actionSheet.expense_id === null && (
              <>
                <div style={{ height: '1px', background: 'var(--slate-100)', margin: '4px 12px' }} />
                <ActionItem
                  iconBg="var(--error-light)" iconColor="var(--error)"
                  title="Supprimer" desc="Retirer cette dépense du mois"
                  icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>}
                  onClick={() => openDeleteSheet(actionSheet)}
                  destructive
                />
              </>
            )}
          </div>
        </SheetWrapper>
      )}

      {/* ====== SHEET: DEFER ====== */}
      {deferSheet && (
        <SheetWrapper onClose={() => setDeferSheet(null)}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--slate-300)' }} />
          </div>
          <div style={{ padding: '0 20px 8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.02em', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--slate-100)' }}>
              Reporter «&nbsp;{deferSheet.name}&nbsp;»
            </h3>

            {/* Expense summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                {deferSheet.section?.icon ?? '💳'}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.01em' }}>{deferSheet.name}</p>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-400)' }}>
                  ${Number(deferSheet.amount).toLocaleString('fr-CA')} · {deferSheet.section?.name ?? '—'}
                </p>
              </div>
            </div>

            {/* Month grid */}
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--slate-400)', marginBottom: '6px' }}>
              Reporter vers
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {getFutureMonths(month).map(({ key, monthLabel, yearLabel }) => (
                <button
                  key={key}
                  onClick={() => setDeferTargetMonth(key)}
                  style={{
                    padding: '14px 12px',
                    border: `1.5px solid ${deferTargetMonth === key ? 'var(--teal-700)' : 'var(--slate-200)'}`,
                    borderRadius: 'var(--radius-md)',
                    background: deferTargetMonth === key ? 'var(--teal-50)' : 'var(--white)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontFamily: 'var(--font)',
                    boxShadow: deferTargetMonth === key ? '0 0 0 3px rgba(15, 118, 110, 0.06)' : 'none',
                  }}
                >
                  <p style={{ fontSize: '14px', fontWeight: 700, color: deferTargetMonth === key ? 'var(--teal-700)' : 'var(--slate-900)', letterSpacing: '-0.01em' }}>{monthLabel}</p>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--slate-400)', marginTop: '2px' }}>{yearLabel}</p>
                </button>
              ))}
            </div>

            <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--slate-400)', marginBottom: '0' }}>
              <svg style={{ width: '13px', height: '13px', verticalAlign: '-2px', marginRight: '4px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
              La dépense disparaîtra de ce mois et apparaîtra dans le mois choisi.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', padding: '16px 20px 4px' }}>
            <button onClick={() => setDeferSheet(null)} style={btnCancelStyle}>Annuler</button>
            <button onClick={confirmDefer} disabled={!deferTargetMonth} style={btnPrimaryStyle}>{getDeferLabel()}</button>
          </div>
        </SheetWrapper>
      )}

      {/* ====== SHEET: EDIT AMOUNT ====== */}
      {editAmountSheet && (
        <SheetWrapper onClose={() => setEditAmountSheet(null)}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--slate-300)' }} />
          </div>
          <div style={{ padding: '0 20px 8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.02em', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--slate-100)' }}>
              Modifier le montant
            </h3>

            {/* Expense summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '16px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                {editAmountSheet.section?.icon ?? '💳'}
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.01em' }}>{editAmountSheet.name}</p>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-400)' }}>
                  Montant actuel: ${Number(editAmountSheet.amount).toLocaleString('fr-CA')} · {editAmountSheet.section?.name ?? '—'}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--slate-400)', marginBottom: '6px' }}>
                Nouveau montant
              </p>
              <input
                type="number" min="0" step="0.01"
                value={editAmountValue}
                onChange={(e) => setEditAmountValue(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%', padding: '16px',
                  border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-sm)',
                  fontFamily: 'var(--font)', fontSize: '28px', fontWeight: 800,
                  letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
                  textAlign: 'center', color: 'var(--slate-900)', background: 'var(--white)',
                  outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                  WebkitAppearance: 'none',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--teal-700)'; e.target.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.08)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--slate-200)'; e.target.style.boxShadow = 'none'; }}
              />
              <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--slate-400)', marginTop: '6px' }}>
                Modification pour {currentMonthLabel} uniquement. Le gabarit restera à ${Number(editAmountSheet.amount).toLocaleString('fr-CA')}.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', padding: '16px 20px 4px' }}>
            <button onClick={() => setEditAmountSheet(null)} style={btnCancelStyle}>Annuler</button>
            <button onClick={confirmEditAmount} style={btnPrimaryStyle}>Enregistrer</button>
          </div>
        </SheetWrapper>
      )}

      {/* ====== SHEET: DELETE CONFIRM ====== */}
      {deleteSheet && (
        <SheetWrapper onClose={() => setDeleteSheet(null)}>
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
            <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--slate-300)' }} />
          </div>
          <div style={{ textAlign: 'center', padding: '8px 20px 0' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--error-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
              Supprimer cette dépense?
            </h3>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--slate-500)', lineHeight: 1.5 }}>
              <strong style={{ fontWeight: 700, color: 'var(--slate-700)' }}>{deleteSheet.name} — ${Number(deleteSheet.amount).toLocaleString('fr-CA')}</strong> sera retiré de tes dépenses de {currentMonthLabel}. Cette action est irréversible.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', padding: '20px 20px 4px' }}>
            <button onClick={() => setDeleteSheet(null)} style={btnCancelStyle}>Annuler</button>
            <button onClick={confirmDelete} style={{ ...btnPrimaryStyle, background: 'var(--error)' }}>Supprimer</button>
          </div>
        </SheetWrapper>
      )}

      {/* ====== ADHOC MODAL ====== */}
      {adhocModal && (
        <AdhocExpenseModal
          sections={sections}
          cards={cards}
          month={month}
          onClose={() => { setAdhocModal(false); router.refresh(); }}
        />
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SheetWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <style>{`
        .depenses-sheet {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--white);
          border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          z-index: 210;
          max-height: 85dvh;
          overflow-y: auto;
          overscroll-behavior: contain;
          box-shadow: 0 -8px 32px rgba(15, 23, 42, 0.15);
          padding-bottom: max(16px, env(safe-area-inset-bottom));
        }
        @media (min-width: 1024px) {
          .depenses-sheet {
            bottom: auto;
            top: 50%;
            left: 50%;
            right: auto;
            width: calc(100% - 48px);
            max-width: 480px;
            border-radius: var(--radius-lg);
            transform: translate(-50%, -50%);
            box-shadow: 0 24px 48px rgba(15, 23, 42, 0.18), 0 8px 16px rgba(15, 118, 110, 0.06);
            max-height: calc(100dvh - 64px);
            padding-bottom: 16px;
          }
          .depenses-sheet .sheet-handle-bar-container {
            display: none;
          }
        }
      `}</style>
      <div
        className="depenses-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  );
}

type ActionItemProps = {
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
  showChevron?: boolean;
  destructive?: boolean;
};

function ActionItem({ iconBg, iconColor, title, desc, icon, onClick, showChevron, destructive }: ActionItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 12px',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        border: 'none', background: 'none', width: '100%', textAlign: 'left',
        fontFamily: 'var(--font)',
      }}
    >
      <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ width: '20px', height: '20px' }}>{icon}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: destructive ? 'var(--error)' : 'var(--slate-900)', letterSpacing: '-0.01em' }}>{title}</p>
        <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--slate-400)', marginTop: '1px' }}>{desc}</p>
      </div>
      {showChevron && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--slate-300)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  );
}

// Shared button styles
const btnCancelStyle: React.CSSProperties = {
  flex: 1, padding: '14px 20px',
  border: '1px solid var(--slate-200)', background: 'var(--white)',
  borderRadius: 'var(--radius-md)', fontFamily: 'var(--font)',
  fontSize: '15px', fontWeight: 600, color: 'var(--slate-700)',
  cursor: 'pointer', transition: 'all 0.2s ease', letterSpacing: '-0.01em',
};

const btnPrimaryStyle: React.CSSProperties = {
  flex: 1.4, padding: '14px 24px',
  border: 'none', background: 'var(--teal-700)',
  borderRadius: 'var(--radius-md)', fontFamily: 'var(--font)',
  fontSize: '15px', fontWeight: 700, color: 'var(--white)',
  cursor: 'pointer', transition: 'all 0.2s ease', letterSpacing: '-0.01em',
};
