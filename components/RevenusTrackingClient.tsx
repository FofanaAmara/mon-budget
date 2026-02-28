'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markIncomeReceived, markVariableIncomeReceived } from '@/lib/actions/monthly-incomes';
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

  const today = currentMonthKey();
  const isCurrentMonth = month === today;

  // Variable incomes not yet in monthly_incomes for this month
  const variableIncomes = allIncomes.filter(i => i.frequency === 'VARIABLE');
  const variableInMonthly = new Set(monthlyIncomes.map(mi => mi.income_id));
  const unregisteredVariables = variableIncomes.filter(i => !variableInMonthly.has(i.id));

  const progressPct = incomeSummary.expectedTotal > 0
    ? (incomeSummary.actualTotal / incomeSummary.expectedTotal) * 100
    : 0;

  function openReceiveFixed(mi: MonthlyIncome) {
    setReceiveAmount(String(mi.expected_amount ?? ''));
    setReceiveModal({ income: mi, variableIncome: null });
  }

  function openReceiveVariable(inc: Income) {
    setReceiveAmount(String(inc.estimated_amount ?? ''));
    setReceiveModal({ income: null, variableIncome: inc });
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
        </div>
        {/* Progress bar */}
        <div style={{
          marginTop: '12px', height: '4px', borderRadius: '2px',
          background: 'rgba(255,255,255,0.2)',
        }}>
          <div style={{
            height: '100%', borderRadius: '2px',
            background: 'rgba(255,255,255,0.9)',
            width: `${Math.min(progressPct, 100)}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>
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
    </div>
  );
}
