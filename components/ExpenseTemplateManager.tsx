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

export default function ExpenseTemplateManager({ expenses, sections, cards }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sectionModal, setSectionModal] = useState<{ section: Section; expenses: Expense[] } | null>(null);
  const [, startTransition] = useTransition();

  const isClient = useSyncExternalStore(() => () => {}, () => true, () => false);

  // Filter: only RECURRING and ONE_TIME (exclude PLANNED — those are in /projets)
  const templateExpenses = expenses.filter(e => e.type !== 'PLANNED');

  const grouped = sections.map((section) => ({
    section,
    expenses: templateExpenses.filter((e) => e.section_id === section.id),
  })).filter((g) => g.expenses.length > 0);

  const unsectioned = templateExpenses.filter((e) => !e.section_id);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{
            fontSize: 'var(--text-sm)', fontWeight: 650,
            color: 'var(--text-primary)',
          }}>
            Mes charges fixes
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {templateExpenses.length} depense{templateExpenses.length !== 1 ? 's' : ''} recurrente{templateExpenses.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setEditingExpense(undefined); setShowModal(true); }}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: 'var(--text-xs)' }}
        >
          + Ajouter
        </button>
      </div>

      {/* Empty state */}
      {templateExpenses.length === 0 && (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.5 }}>💸</div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
            Aucune charge fixe
          </p>
        </div>
      )}

      {/* Grouped sections */}
      {grouped.map(({ section, expenses: se }) => (
        <div key={section.id} className="card" style={{ overflow: 'hidden' }}>
          <div className="flex items-center justify-between" style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--surface-sunken)',
          }}>
            <div className="flex items-center" style={{ gap: '10px' }}>
              <div style={{
                width: '28px', height: '28px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem',
                background: 'var(--surface-sunken)',
              }}>
                {section.icon}
              </div>
              <span style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                {section.name}
              </span>
            </div>
            <span className="amount" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              {formatCAD(se.reduce((sum, e) => sum + Number(e.amount), 0))}/mois
            </span>
          </div>
          <div>
            {se.slice(0, 3).map((e, i) => (
              <div key={e.id}>
                {i > 0 && <div className="divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
                <ExpenseRow expense={e} />
              </div>
            ))}
          </div>
          {se.length > 3 && (
            <button
              onClick={() => setSectionModal({ section, expenses: se })}
              style={{
                width: '100%',
                padding: '10px 20px',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--accent)',
                background: 'var(--surface-inset)',
                cursor: 'pointer',
                border: 'none',
                borderTop: '1px solid var(--surface-sunken)',
              }}
            >
              Voir tout ({se.length})
            </button>
          )}
        </div>
      ))}

      {/* Unsectioned */}
      {unsectioned.length > 0 && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="flex items-center justify-between" style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--surface-sunken)',
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
              Sans section
            </span>
            <span className="amount" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
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

      {/* Section detail modal */}
      {sectionModal && (
        <div
          className="sheet-backdrop"
          onClick={(e) => e.target === e.currentTarget && setSectionModal(null)}
        >
          <div className="sheet">
            <div className="sheet-handle" />
            <div style={{ padding: '8px 24px 32px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                <div className="flex items-center" style={{ gap: '10px' }}>
                  <span style={{ fontSize: '1.25rem' }}>{sectionModal.section.icon}</span>
                  <h2 style={{
                    fontSize: 'var(--text-lg)', fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: 'var(--tracking-tight)',
                  }}>
                    {sectionModal.section.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSectionModal(null)}
                  className="icon-btn"
                  aria-label="Fermer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="card" style={{ overflow: 'hidden' }}>
                {sectionModal.expenses.map((e, i) => (
                  <div key={e.id}>
                    {i > 0 && <div className="divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
                    <ExpenseRow expense={e} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
