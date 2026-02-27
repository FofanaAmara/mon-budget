'use client';

import { useState } from 'react';
import { deleteIncome } from '@/lib/actions/incomes';
import { calcMonthlyIncome, formatCAD } from '@/lib/utils';
import type { Income, IncomeFrequency, IncomeSource } from '@/lib/types';
import IncomeModal from './IncomeModal';

const FREQUENCY_LABELS: Record<IncomeFrequency, string> = {
  MONTHLY: 'Mensuel',
  BIWEEKLY: 'Aux 2 sem.',
  YEARLY: 'Annuel',
  VARIABLE: 'Variable',
};

const SOURCE_META: Record<IncomeSource, { label: string; icon: string; color: string; bg: string }> = {
  EMPLOYMENT: { label: 'Emploi',         icon: '💼', color: '#2563EB', bg: '#EFF6FF' },
  BUSINESS:   { label: 'Business',       icon: '🏢', color: '#7C3AED', bg: '#F5F3FF' },
  INVESTMENT: { label: 'Investissement', icon: '📈', color: '#059669', bg: '#ECFDF5' },
  OTHER:      { label: 'Autre',          icon: '🔧', color: '#6B7280', bg: '#F9FAFB' },
};

type Props = {
  incomes: Income[];
};

export default function IncomeTemplateManager({ incomes }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editIncome, setEditIncome] = useState<Income | undefined>(undefined);
  const [showAllModal, setShowAllModal] = useState(false);

  function openAdd() {
    setEditIncome(undefined);
    setShowModal(true);
  }

  function openEdit(inc: Income) {
    setEditIncome(inc);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditIncome(undefined);
  }

  async function handleDelete(id: string) {
    if (confirm('Supprimer ce revenu ?')) {
      await deleteIncome(id);
    }
  }

  const monthlyTotal = incomes.reduce((sum, inc) => {
    return sum + calcMonthlyIncome(
      inc.amount != null ? Number(inc.amount) : null,
      inc.frequency,
      inc.estimated_amount != null ? Number(inc.estimated_amount) : null,
    );
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{
            fontSize: 'var(--text-sm)', fontWeight: 650,
            color: 'var(--text-primary)',
          }}>
            Mes revenus recurrents
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {incomes.length} source{incomes.length !== 1 ? 's' : ''} · {formatCAD(monthlyTotal)}/mois
          </p>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary"
          style={{ padding: '8px 16px', fontSize: 'var(--text-xs)' }}
        >
          + Ajouter
        </button>
      </div>

      {/* Income list */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {incomes.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.5 }}>💰</div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
              Aucun revenu enregistre
            </p>
          </div>
        ) : (
          <>
            {incomes.slice(0, 3).map((inc, i) => (
              <IncomeRow key={inc.id} inc={inc} index={i} onEdit={openEdit} onDelete={handleDelete} />
            ))}
            {incomes.length > 3 && (
              <button
                onClick={() => setShowAllModal(true)}
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
                Voir tout ({incomes.length})
              </button>
            )}
          </>
        )}
      </div>

      {/* All incomes modal */}
      {showAllModal && (
        <div
          className="sheet-backdrop"
          onClick={(e) => e.target === e.currentTarget && setShowAllModal(false)}
        >
          <div className="sheet">
            <div className="sheet-handle" />
            <div style={{ padding: '8px 24px 32px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
                <h2 style={{
                  fontSize: 'var(--text-lg)', fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: 'var(--tracking-tight)',
                }}>
                  Tous les revenus ({incomes.length})
                </h2>
                <button
                  onClick={() => setShowAllModal(false)}
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
                {incomes.map((inc, i) => (
                  <IncomeRow key={inc.id} inc={inc} index={i} onEdit={(inc) => { setShowAllModal(false); openEdit(inc); }} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && <IncomeModal income={editIncome} onClose={closeModal} />}
    </div>
  );
}

function IncomeRow({
  inc,
  index,
  onEdit,
  onDelete,
}: {
  inc: Income;
  index: number;
  onEdit: (inc: Income) => void;
  onDelete: (id: string) => void;
}) {
  const monthly = calcMonthlyIncome(
    inc.amount != null ? Number(inc.amount) : null,
    inc.frequency,
    inc.estimated_amount != null ? Number(inc.estimated_amount) : null,
  );
  const srcMeta = SOURCE_META[inc.source ?? 'OTHER'];
  const isVariable = inc.frequency === 'VARIABLE';

  return (
    <div>
      {index > 0 && <div className="divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
      <div className="flex items-center" style={{ gap: '12px', padding: '12px 20px' }}>
        <div style={{
          width: '32px', height: '32px',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: srcMeta.bg,
          flexShrink: 0,
          fontSize: '14px',
        }}>
          {srcMeta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center" style={{ gap: '6px', flexWrap: 'wrap' }}>
            <p style={{
              fontWeight: 600, color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {inc.name}
            </p>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: '999px',
              background: srcMeta.bg,
              color: srcMeta.color,
              flexShrink: 0,
            }}>
              {srcMeta.label}
            </span>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '3px' }}>
            {isVariable ? (
              <span>Variable{monthly > 0 ? ` · ~${formatCAD(monthly)}/mois` : ''}</span>
            ) : (
              <>
                {FREQUENCY_LABELS[inc.frequency]}
                {inc.frequency !== 'MONTHLY' && monthly > 0 && (
                  <span> · {formatCAD(monthly)}/mois</span>
                )}
              </>
            )}
          </p>
        </div>
        <span className="amount" style={{ fontSize: 'var(--text-sm)', color: 'var(--positive)', flexShrink: 0 }}>
          {isVariable
            ? (monthly > 0 ? `~${formatCAD(monthly)}` : '—')
            : formatCAD(Number(inc.amount))}
        </span>
        <div className="flex items-center" style={{ gap: '2px' }}>
          <button onClick={() => onEdit(inc)} className="icon-btn" aria-label="Modifier">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
            </svg>
          </button>
          <button onClick={() => onDelete(inc.id)} className="icon-btn icon-btn-danger" aria-label="Supprimer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
