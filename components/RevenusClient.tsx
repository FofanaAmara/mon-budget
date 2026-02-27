'use client';

import { useState } from 'react';
import { deleteIncome } from '@/lib/actions/incomes';
import { calcMonthlyIncome, formatCAD } from '@/lib/utils';
import type { Income, IncomeFrequency } from '@/lib/types';
import IncomeModal from './IncomeModal';

const FREQUENCY_LABELS: Record<IncomeFrequency, string> = {
  MONTHLY: 'Mensuel',
  BIWEEKLY: 'Aux 2 sem.',
  YEARLY: 'Annuel',
};

type Props = {
  incomes: Income[];
  monthlyTotal: number;
};

export default function RevenusClient({ incomes, monthlyTotal }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [editIncome, setEditIncome] = useState<Income | undefined>(undefined);

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
          Revenus
        </h1>
        <p style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-tertiary)',
          marginTop: '4px',
          fontWeight: 500,
        }}>
          {incomes.length} source{incomes.length !== 1 ? 's' : ''} de revenus
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Total monthly hero card */}
        <div className="hero-card hero-card-positive">
          <p style={{
            color: 'rgba(250,250,248,0.60)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            letterSpacing: 'var(--tracking-widest)',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}>
            Total mensuel net
          </p>
          <p className="amount" style={{
            fontSize: 'var(--text-2xl)',
            color: 'var(--text-inverted)',
          }}>
            {formatCAD(monthlyTotal)}
          </p>
        </div>

        {/* Income list */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {incomes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <p className="empty-state-text">Aucun revenu ajoute</p>
              <p className="empty-state-hint">Ajoutez vos sources de revenus pour calculer votre reste a vivre</p>
            </div>
          ) : (
            incomes.map((inc, i) => {
              const monthly = calcMonthlyIncome(Number(inc.amount), inc.frequency);
              return (
                <div key={inc.id}>
                  {i > 0 && <div className="divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
                  <div className="flex items-center" style={{ gap: '12px', padding: '12px 20px' }}>
                    {/* Icon */}
                    <div style={{
                      width: '36px', height: '36px',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--positive-subtle)',
                      flexShrink: 0,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--positive-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: 600, color: 'var(--text-primary)',
                        fontSize: 'var(--text-sm)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {inc.name}
                      </p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        {FREQUENCY_LABELS[inc.frequency]}
                        {inc.frequency !== 'MONTHLY' && (
                          <span> · {formatCAD(monthly)}/mois</span>
                        )}
                      </p>
                    </div>

                    {/* Amount */}
                    <span className="amount" style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--positive)',
                      flexShrink: 0,
                    }}>
                      {formatCAD(Number(inc.amount))}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center" style={{ gap: '2px' }}>
                      <button
                        onClick={() => openEdit(inc)}
                        className="icon-btn"
                        aria-label="Modifier"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(inc.id)}
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
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={openAdd}
        className="fab"
        aria-label="Ajouter un revenu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {showModal && <IncomeModal income={editIncome} onClose={closeModal} />}
    </div>
  );
}
