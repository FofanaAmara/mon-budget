'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markAsPaid, markAsDeferred, markAsUpcoming } from '@/lib/actions/monthly-expenses';
import { formatCAD, formatShortDate } from '@/lib/utils';
import type { MonthlyExpense, MonthSummary, MonthlyExpenseStatus, Section } from '@/lib/types';

type Props = {
  expenses: MonthlyExpense[];
  summary: MonthSummary;
  sections: Section[];
  month: string;
};

function parseMonth(month: string): { year: number; monthNum: number } {
  const [y, m] = month.split('-').map(Number);
  return { year: y, monthNum: m };
}

function monthLabel(month: string): string {
  const { year, monthNum } = parseMonth(month);
  return new Intl.DateTimeFormat('fr-CA', { month: 'long', year: 'numeric' })
    .format(new Date(year, monthNum - 1, 1));
}

function prevMonth(month: string): string {
  const { year, monthNum } = parseMonth(month);
  const d = new Date(year, monthNum - 2, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function nextMonth(month: string): string {
  const { year, monthNum } = parseMonth(month);
  const d = new Date(year, monthNum, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const STATUS_LABELS: Record<MonthlyExpenseStatus, string> = {
  UPCOMING: 'À venir',
  PAID: 'Payé',
  OVERDUE: 'En retard',
  DEFERRED: 'Reporté',
};

const STATUS_STYLES: Record<MonthlyExpenseStatus, string> = {
  UPCOMING: 'bg-blue-50 text-blue-700',
  PAID: 'bg-emerald-50 text-emerald-700',
  OVERDUE: 'bg-red-50 text-red-600',
  DEFERRED: 'bg-[#F8FAFC] text-[#94A3B8]',
};

const GROUP_ORDER: MonthlyExpenseStatus[] = ['OVERDUE', 'UPCOMING', 'DEFERRED', 'PAID'];
const GROUP_LABELS: Record<MonthlyExpenseStatus, string> = {
  OVERDUE: '⚠️ En retard',
  UPCOMING: '⏳ À venir',
  DEFERRED: '⏭️ Reporté',
  PAID: '✅ Payé',
};

export default function MonMoisClient({ expenses, summary, sections, month }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const today = currentMonthKey();
  const isCurrentMonth = month === today;

  const filtered = selectedSection
    ? expenses.filter((e) => e.section_id === selectedSection)
    : expenses;

  const grouped = GROUP_ORDER.map((status) => ({
    status,
    items: filtered.filter((e) => e.status === status),
  })).filter((g) => g.items.length > 0);

  const progressPct = summary.count > 0 ? (summary.paid_count / summary.count) * 100 : 0;

  function handleAction(id: string, action: 'paid' | 'deferred' | 'upcoming') {
    startTransition(async () => {
      if (action === 'paid') await markAsPaid(id);
      else if (action === 'deferred') await markAsDeferred(id);
      else await markAsUpcoming(id);
      router.refresh();
    });
  }

  function navigateMonth(target: string) {
    router.push(`/mon-mois?month=${target}`);
  }

  return (
    <div className="px-4 pt-8 pb-24 min-h-screen">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigateMonth(prevMonth(month))}
          className="p-2 text-[#94A3B8] hover:text-[#1E293B] rounded-xl transition-colors"
          aria-label="Mois précédent"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="text-center">
          <h1 className="text-lg font-bold text-[#1E293B] capitalize">{monthLabel(month)}</h1>
          {!isCurrentMonth && (
            <button
              onClick={() => navigateMonth(today)}
              className="text-xs text-[#2563EB] mt-0.5"
            >
              Retour au mois actuel
            </button>
          )}
        </div>

        <button
          onClick={() => navigateMonth(nextMonth(month))}
          className="p-2 text-[#94A3B8] hover:text-[#1E293B] rounded-xl transition-colors"
          aria-label="Mois suivant"
          disabled={month >= today}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={month >= today ? '#E2E8F0' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* Progress card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[#1E293B]">
            {summary.paid_count}/{summary.count} dépenses complétées
          </span>
          {summary.overdue_count > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
              {summary.overdue_count} en retard
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(progressPct, summary.count > 0 ? 1 : 0)}%`,
              backgroundColor: progressPct >= 100 ? '#10B981' : '#2563EB',
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-[#94A3B8]">
          <span>{formatCAD(summary.paid_total)} payé</span>
          <span>{formatCAD(summary.total)} total</span>
        </div>
      </div>

      {/* Section filter */}
      {sections.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
          <button
            onClick={() => setSelectedSection(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedSection === null
                ? 'bg-[#1E293B] text-white'
                : 'bg-white border border-[#E2E8F0] text-[#94A3B8]'
            }`}
          >
            Tout
          </button>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSection(s.id === selectedSection ? null : s.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedSection === s.id
                  ? 'bg-[#1E293B] text-white'
                  : 'bg-white border border-[#E2E8F0] text-[#94A3B8]'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {expenses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">📅</div>
          <p className="text-[#94A3B8] text-sm mb-2">Aucune dépense ce mois</p>
          <p className="text-xs text-[#CBD5E1]">
            Les dépenses récurrentes apparaissent automatiquement
          </p>
        </div>
      )}

      {/* Grouped expenses by status */}
      <div className="space-y-4">
        {grouped.map(({ status, items }) => (
          <div key={status}>
            <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2 px-1">
              {GROUP_LABELS[status]} ({items.length})
            </h2>
            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
              <div className="divide-y divide-[#F8FAFC]">
                {items.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    isCurrentMonth={isCurrentMonth}
                    onAction={handleAction}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpenseRow({
  expense,
  isCurrentMonth,
  onAction,
}: {
  expense: MonthlyExpense;
  isCurrentMonth: boolean;
  onAction: (id: string, action: 'paid' | 'deferred' | 'upcoming') => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[#1E293B] text-sm truncate">{expense.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${STATUS_STYLES[expense.status]}`}>
              {STATUS_LABELS[expense.status]}
            </span>
            <span className="text-xs text-[#94A3B8]">
              {expense.is_auto_charged ? '· Auto' : ''}
              {expense.due_date ? ` · ${formatShortDate(expense.due_date)}` : ''}
            </span>
          </div>
        </div>

        <span className="font-semibold text-[#1E293B] text-sm flex-shrink-0">
          {formatCAD(Number(expense.amount))}
        </span>

        {/* Actions — only for current month */}
        {isCurrentMonth && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-[#94A3B8] hover:text-[#1E293B] rounded-lg transition-colors flex-shrink-0"
            aria-label="Actions"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="5" r="1" fill="currentColor" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
              <circle cx="12" cy="19" r="1" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>

      {/* Inline action buttons */}
      {expanded && isCurrentMonth && (
        <div className="flex gap-2 mt-2 ml-0">
          {expense.status !== 'PAID' && (
            <button
              onClick={() => { onAction(expense.id, 'paid'); setExpanded(false); }}
              className="flex-1 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              ✓ Marquer payé
            </button>
          )}
          {expense.status === 'PAID' && (
            <button
              onClick={() => { onAction(expense.id, 'upcoming'); setExpanded(false); }}
              className="flex-1 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              ↩ Annuler
            </button>
          )}
          {expense.status !== 'DEFERRED' && expense.status !== 'PAID' && (
            <button
              onClick={() => { onAction(expense.id, 'deferred'); setExpanded(false); }}
              className="flex-1 py-1.5 text-xs font-semibold rounded-xl bg-[#F8FAFC] text-[#94A3B8] hover:bg-[#F1F5F9] transition-colors"
            >
              ⏭ Reporter
            </button>
          )}
        </div>
      )}
    </div>
  );
}
