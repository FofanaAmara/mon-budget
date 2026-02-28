'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markIncomeReceived, markIncomeAsExpected, markVariableIncomeReceived, deleteMonthlyIncome, updateMonthlyIncomeAmount } from '@/lib/actions/monthly-incomes';
import { formatCAD } from '@/lib/utils';
import { currentMonthKey } from '@/lib/month-utils';
import MonthNavigator from '@/components/MonthNavigator';
import { IncomeInstanceRow, VariableIncomeRow } from '@/components/IncomeTrackingRow';
import AdhocIncomeModal from '@/components/AdhocIncomeModal';
import type { MonthlyIncome, Income } from '@/lib/types';

type Props = {
  monthlyIncomes: MonthlyIncome[];
  incomeSummary: { expectedTotal: number; actualTotal: number };
  allIncomes: Income[];
  month: string;
};

export default function RevenusTrackingClient({ monthlyIncomes, incomeSummary, allIncomes, month }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [receiveModal, setReceiveModal] = useState<{ income: MonthlyIncome | null; variableIncome: Income | null } | null>(null);
  const [receiveAmount, setReceiveAmount] = useState('');
  const [adhocModal, setAdhocModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<MonthlyIncome | null>(null);
  const [updateAmountModal, setUpdateAmountModal] = useState<MonthlyIncome | null>(null);
  const [updateAmount, setUpdateAmount] = useState('');

  const today = currentMonthKey();
  const isCurrentMonth = month === today;

  // Variable incomes not yet in monthly_incomes for this month
  const variableIncomes = allIncomes.filter(i => i.frequency === 'VARIABLE');
  const variableInMonthly = new Set(monthlyIncomes.map(mi => mi.income_id));
  const unregisteredVariables = variableIncomes.filter(i => !variableInMonthly.has(i.id));

  const progressPct = incomeSummary.expectedTotal > 0
    ? (incomeSummary.actualTotal / incomeSummary.expectedTotal) * 100
    : 0;
  const isOverIncome = incomeSummary.actualTotal > incomeSummary.expectedTotal && incomeSummary.expectedTotal > 0;
  const surplus = incomeSummary.actualTotal - incomeSummary.expectedTotal;

  function openReceiveFixed(mi: MonthlyIncome) {
    setReceiveAmount(String(mi.expected_amount ?? ''));
    setReceiveModal({ income: mi, variableIncome: null });
  }

  function openReceiveVariable(inc: Income) {
    setReceiveAmount(String(inc.estimated_amount ?? ''));
    setReceiveModal({ income: null, variableIncome: inc });
  }

  function handleMarkExpected(id: string) {
    startTransition(async () => {
      await markIncomeAsExpected(id);
      router.refresh();
    });
  }

  function handleDelete(mi: MonthlyIncome) {
    setDeleteModal(mi);
  }

  function confirmDelete() {
    if (!deleteModal) return;
    startTransition(async () => {
      await deleteMonthlyIncome(deleteModal.id);
      setDeleteModal(null);
      router.refresh();
    });
  }

  function openUpdateAmount(mi: MonthlyIncome) {
    setUpdateAmount(String(mi.expected_amount ?? ''));
    setUpdateAmountModal(mi);
  }

  function confirmUpdateAmount() {
    if (!updateAmountModal) return;
    const amt = parseFloat(updateAmount);
    if (isNaN(amt) || amt < 0) return;
    startTransition(async () => {
      await updateMonthlyIncomeAmount(updateAmountModal.id, amt);
      setUpdateAmountModal(null);
      setUpdateAmount('');
      router.refresh();
    });
  }

  async function handleMarkReceived() {
    if (!receiveModal) return;
    const amt = parseFloat(receiveAmount);
    if (isNaN(amt) || amt <= 0) return;
    startTransition(async () => {
      if (receiveModal.income) {
        await markIncomeReceived(receiveModal.income.id, amt);
      } else if (receiveModal.variableIncome) {
        await markVariableIncomeReceived(receiveModal.variableIncome.id, month, amt);
      }
      setReceiveModal(null);
      setReceiveAmount('');
      router.refresh();
    });
  }

  return (
    <div style={{ padding: '36px 20px 96px', minHeight: '100vh' }}>
      <MonthNavigator month={month} basePath="/revenus" />

      {/* Hero card */}
      <div style={{
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        marginBottom: '16px',
        background: progressPct >= 80
          ? 'linear-gradient(135deg, #1A7F5A, #145C42)'
          : progressPct >= 40
            ? 'linear-gradient(135deg, #C27815, #8C5710)'
            : 'linear-gradient(135deg, #3D3BF3, #3230D4)',
        color: 'white',
      }}>
        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, opacity: 0.75, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>
          Revenus du mois
        </p>
        <p className="amount" style={{ fontSize: 'var(--text-2xl)', fontWeight: 750, letterSpacing: 'var(--tracking-tight)' }}>
          {formatCAD(incomeSummary.actualTotal)}
        </p>
        <div className="flex items-center" style={{ gap: '16px', marginTop: '12px', fontSize: 'var(--text-xs)', opacity: 0.85 }}>
          <span>Attendu {formatCAD(incomeSummary.expectedTotal)}</span>
          <span>Reçu {formatCAD(incomeSummary.actualTotal)}</span>
          {isOverIncome && <span style={{ opacity: 1, fontWeight: 700 }}>+{formatCAD(surplus)}</span>}
        </div>
        {/* Progress bar */}
        <div style={{
          marginTop: '12px', height: '4px', borderRadius: '2px',
          background: 'rgba(255,255,255,0.2)',
          position: 'relative', overflow: 'visible',
        }}>
          {isOverIncome ? (
            <>
              {/* White segment = expected portion */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${(incomeSummary.expectedTotal / incomeSummary.actualTotal) * 100}%`,
                background: 'rgba(255,255,255,0.9)',
                borderRadius: '2px 0 0 2px',
              }} />
              {/* Gold overflow segment = surplus */}
              <div style={{
                position: 'absolute',
                left: `${(incomeSummary.expectedTotal / incomeSummary.actualTotal) * 100}%`,
                top: 0, bottom: 0,
                width: `${(surplus / incomeSummary.actualTotal) * 100}%`,
                background: '#FFD700',
                borderRadius: '0 2px 2px 0',
                boxShadow: '0 0 8px rgba(255,215,0,0.5)',
              }} />
            </>
          ) : (
            <div style={{
              height: '100%', borderRadius: '2px',
              background: 'rgba(255,255,255,0.9)',
              width: `${Math.min(progressPct, 100)}%`,
              transition: 'width 0.3s ease',
            }} />
          )}
        </div>
        {isOverIncome && (
          <div style={{
            marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '3px 8px', borderRadius: '999px',
            background: 'rgba(255,215,0,0.25)', fontSize: 'var(--text-xs)', fontWeight: 600,
          }}>
            ✦ {formatCAD(surplus)} au-dessus des attentes
          </div>
        )}
      </div>

      {/* Incomes list — split into expected vs adhoc */}
      {(() => {
        const expectedIncomes = monthlyIncomes.filter(mi => Number(mi.expected_amount ?? 0) > 0);
        const adhocIncomes = monthlyIncomes.filter(mi => Number(mi.expected_amount ?? 0) === 0);
        const totalCount = monthlyIncomes.length + unregisteredVariables.length;

        if (totalCount === 0) return (
          <div className="flex flex-col items-center justify-center text-center" style={{ padding: '80px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.6 }}>💰</div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginBottom: '8px', fontWeight: 500 }}>
              Aucun revenu ce mois
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', opacity: 0.7 }}>
              Les revenus recurrents apparaissent automatiquement
            </p>
          </div>
        );

        return (
          <>
            {/* Revenus attendus */}
            {(expectedIncomes.length > 0 || unregisteredVariables.length > 0) && (
              <div style={{ marginBottom: '20px' }}>
                <h2 className="section-label" style={{ marginBottom: '12px', paddingLeft: '4px' }}>
                  Revenus attendus ({expectedIncomes.length + unregisteredVariables.length})
                </h2>
                <div className="card" style={{ overflow: 'hidden' }}>
                  {expectedIncomes.map((mi, i) => (
                    <IncomeInstanceRow
                      key={mi.id}
                      mi={mi}
                      index={i}
                      isCurrentMonth={isCurrentMonth}
                      onMarkReceived={() => openReceiveFixed(mi)}
                      onMarkExpected={() => handleMarkExpected(mi.id)}
                      onUpdateAmount={() => openUpdateAmount(mi)}
                    />
                  ))}
                  {unregisteredVariables.map((inc, i) => (
                    <VariableIncomeRow
                      key={inc.id}
                      inc={inc}
                      index={expectedIncomes.length + i}
                      isCurrentMonth={isCurrentMonth}
                      onMarkReceived={() => openReceiveVariable(inc)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Revenus ponctuels */}
            {adhocIncomes.length > 0 && (
              <div>
                <h2 className="section-label" style={{ marginBottom: '12px', paddingLeft: '4px' }}>
                  Revenus ponctuels ({adhocIncomes.length})
                </h2>
                <div className="card" style={{ overflow: 'hidden' }}>
                  {adhocIncomes.map((mi, i) => (
                    <IncomeInstanceRow
                      key={mi.id}
                      mi={mi}
                      index={i}
                      isCurrentMonth={isCurrentMonth}
                      onMarkReceived={() => openReceiveFixed(mi)}
                      onMarkExpected={() => handleMarkExpected(mi.id)}
                      onDelete={() => handleDelete(mi)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Adhoc FAB */}
      {isCurrentMonth && (
        <button
          onClick={() => setAdhocModal(true)}
          className="fab"
          aria-label="Ajouter un revenu ponctuel"
          style={{ bottom: 'calc(var(--nav-height) + var(--safe-bottom) + 16px)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {/* Mark received modal */}
      {receiveModal && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setReceiveModal(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding: '8px 24px 32px' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>
                Marquer reçu
              </h2>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {receiveModal.income?.income_name ?? receiveModal.variableIncome?.name}
                </p>
                <label className="field-label" style={{ marginTop: '16px' }}>Montant réellement reçu ($)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={receiveAmount}
                  onChange={(e) => setReceiveAmount(e.target.value)}
                  className="input-field"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                  autoFocus
                />
              </div>
              <button
                onClick={handleMarkReceived}
                className="btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: 'var(--text-base)' }}
              >
                Confirmer la réception
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adhoc income modal */}
      {adhocModal && (
        <AdhocIncomeModal
          month={month}
          onClose={() => { setAdhocModal(false); router.refresh(); }}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setDeleteModal(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding: '8px 24px 32px' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Supprimer ce revenu ?
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                {deleteModal.income_name} sera retiré de ce mois. Cette action est irréversible.
              </p>
              <div className="flex" style={{ gap: '12px' }}>
                <button
                  onClick={() => setDeleteModal(null)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '14px' }}
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  style={{
                    flex: 1, padding: '14px',
                    background: 'var(--negative)', color: 'white',
                    border: 'none', borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-base)', fontWeight: 650, cursor: 'pointer',
                  }}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update expected amount modal */}
      {updateAmountModal && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setUpdateAmountModal(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding: '8px 24px 32px' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Modifier le montant attendu
              </h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
                Ce mois uniquement — le gabarit dans les réglages reste inchangé.
              </p>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {updateAmountModal.income_name}
                </p>
                <label className="field-label" style={{ marginTop: '16px' }}>Nouveau montant attendu ($)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={updateAmount}
                  onChange={(e) => setUpdateAmount(e.target.value)}
                  className="input-field"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                  autoFocus
                />
              </div>
              <button
                onClick={confirmUpdateAmount}
                className="btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: 'var(--text-base)' }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
