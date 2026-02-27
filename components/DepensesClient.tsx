'use client';

import { useState, useTransition, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { deleteExpense } from '@/lib/actions/expenses';
import { formatCAD, formatShortDate, daysUntil } from '@/lib/utils';
import ExpenseModal from '@/components/ExpenseModal';
import type { Expense, Section, Card } from '@/lib/types';

type Props = {
  expenses: Expense[];
  sections: Section[];
  cards: Card[];
};

const SECTION_PREVIEW_COUNT = 3;

export default function DepensesClient({ expenses, sections, cards }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function toggleSection(sectionId: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }
  const isClient = useSyncExternalStore(() => () => {}, () => true, () => false);

  const grouped = sections.map((section) => ({
    section,
    expenses: expenses.filter((e) => e.section_id === section.id),
  })).filter((g) => g.expenses.length > 0);

  const unsectioned = expenses.filter((e) => !e.section_id);

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteExpense(id);
      setDeletingId(null);
      router.refresh();
    });
  }

  function handleEdit(expense: Expense) {
    setEditingExpense(expense);
    setShowModal(true);
  }

  function getDueBadge(expense: Expense) {
    const nd = expense.next_due_date;
    if (!nd) return null;
    const days = daysUntil(nd);
    if (days < 0) return { label: 'En retard', bg: 'var(--negative-subtle)', color: 'var(--negative-text)' };
    if (days === 0) return { label: "Auj.", bg: 'var(--warning-subtle)', color: 'var(--warning-text)' };
    if (days <= 3) return { label: `${days}j`, bg: 'var(--warning-subtle)', color: 'var(--warning-text)' };
    if (days <= 7) return { label: `${days}j`, bg: 'var(--accent-subtle)', color: 'var(--accent)' };
    return { label: formatShortDate(nd), bg: 'var(--surface-sunken)', color: 'var(--text-tertiary)' };
  }

  const ExpenseRow = ({ expense }: { expense: Expense }) => {
    const badge = isClient ? getDueBadge(expense) : null;
    return (
      <div className="flex items-center" style={{ gap: '12px', padding: '12px 20px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontWeight: 600, color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {expense.name}
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {expense.type === 'RECURRING'
              ? `${expense.recurrence_frequency?.toLowerCase()} · j.${expense.recurrence_day}${expense.auto_debit ? ' · Prelev. auto' : ''}`
              : 'Ponctuel'}
          </p>
        </div>

        {badge && (
          <span className="badge" style={{
            background: badge.bg, color: badge.color, flexShrink: 0,
          }}>
            {badge.label}
          </span>
        )}

        <span className="amount" style={{
          fontSize: 'var(--text-sm)', flexShrink: 0,
        }}>
          {formatCAD(expense.amount)}
        </span>

        {deletingId === expense.id ? (
          <div className="confirm-inline">
            <button onClick={() => handleDelete(expense.id)} className="confirm-yes">Oui</button>
            <span className="confirm-sep">|</span>
            <button onClick={() => setDeletingId(null)} className="confirm-no">Non</button>
          </div>
        ) : (
          <div className="flex items-center" style={{ gap: '2px' }}>
            <button
              onClick={() => handleEdit(expense)}
              className="icon-btn"
              aria-label="Modifier"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
              </svg>
            </button>
            <button
              onClick={() => setDeletingId(expense.id)}
              className="icon-btn icon-btn-danger"
              aria-label="Supprimer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  const SectionGroup = ({ section, sectionExpenses }: { section: Section; sectionExpenses: Expense[] }) => {
    const total = sectionExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const isExpanded = expandedSections.has(section.id);
    const hasMore = sectionExpenses.length > SECTION_PREVIEW_COUNT;
    const visibleExpenses = isExpanded ? sectionExpenses : sectionExpenses.slice(0, SECTION_PREVIEW_COUNT);
    const hiddenCount = sectionExpenses.length - SECTION_PREVIEW_COUNT;

    return (
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Group header */}
        <div className="flex items-center justify-between" style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--surface-sunken)',
        }}>
          <div className="flex items-center" style={{ gap: '12px' }}>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: 'var(--radius-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem',
              background: 'var(--surface-sunken)',
            }}>
              {section.icon}
            </div>
            <span style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
              {section.name}
            </span>
          </div>
          <span className="amount" style={{ fontSize: 'var(--text-sm)' }}>
            {formatCAD(total)}/mois
          </span>
        </div>
        {/* Expense rows */}
        <div>
          {visibleExpenses.map((e, i) => (
            <div key={e.id}>
              {i > 0 && <div className="divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
              <ExpenseRow expense={e} />
            </div>
          ))}
        </div>
        {/* Show more / show less */}
        {hasMore && (
          <button
            onClick={() => toggleSection(section.id)}
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--accent)',
              background: 'var(--surface-inset)',
              borderTop: '1px solid var(--surface-sunken)',
              transition: `background var(--duration-fast) var(--ease-out)`,
              cursor: 'pointer',
              border: 'none',
              borderTopWidth: '1px',
              borderTopStyle: 'solid',
              borderTopColor: 'var(--surface-sunken)',
            }}
          >
            {isExpanded
              ? 'Voir moins'
              : `Voir ${hiddenCount} autre${hiddenCount > 1 ? 's' : ''}`}
          </button>
        )}
      </div>
    );
  };

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
          Depenses
        </h1>
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          marginTop: '4px',
          fontWeight: 500,
        }}>
          {expenses.length} depense{expenses.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Empty state */}
      {expenses.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center" style={{ padding: '80px 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.6 }}>💸</div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginBottom: '8px', fontWeight: 500 }}>
            Aucune depense enregistree
          </p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', opacity: 0.7 }}>
            Utilisez le bouton + pour ajouter
          </p>
        </div>
      )}

      {/* Grouped sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {grouped.map(({ section, expenses: se }) => (
          <SectionGroup key={section.id} section={section} sectionExpenses={se} />
        ))}

        {/* Unsectioned */}
        {unsectioned.length > 0 && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="flex items-center justify-between" style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--surface-sunken)',
            }}>
              <span style={{ fontWeight: 600, color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                Sans section
              </span>
              <span className="amount" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                {formatCAD(unsectioned.reduce((s, e) => s + Number(e.amount), 0))}/mois
              </span>
            </div>
            <div>
              {unsectioned.map((e, i) => (
                <div key={e.id}>
                  {i > 0 && <div className="divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
                  <ExpenseRow expense={e} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditingExpense(undefined); setShowModal(true); }}
        className="fab"
        aria-label="Ajouter une depense"
      >
        +
      </button>

      {/* Expense modal */}
      {showModal && (
        <ExpenseModal
          sections={sections}
          cards={cards}
          expense={editingExpense}
          onClose={() => { setShowModal(false); setEditingExpense(undefined); }}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
