'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { markIncomeReceived, markIncomeAsExpected, markVariableIncomeReceived, deleteMonthlyIncome, updateMonthlyIncomeAmount } from '@/lib/actions/monthly-incomes';
import { updateMonthlyAllocation } from '@/lib/actions/allocations';
import { formatCAD } from '@/lib/utils';
import { currentMonthKey } from '@/lib/month-utils';
import MonthNavigator from '@/components/MonthNavigator';
import { IncomeInstanceRow, VariableIncomeRow } from '@/components/IncomeTrackingRow';
import AdhocIncomeModal from '@/components/AdhocIncomeModal';
import AdhocAllocationModal from '@/components/AdhocAllocationModal';
import type { MonthlyIncome, Income, MonthlyAllocation, Section, Expense } from '@/lib/types';

type Props = {
  monthlyIncomes: MonthlyIncome[];
  incomeSummary: { expectedTotal: number; actualTotal: number };
  allIncomes: Income[];
  month: string;
  monthlyAllocations: MonthlyAllocation[];
  sectionActuals: { section_id: string; total: number }[];
  sections: Section[];
  projects: Expense[];
  initialTab?: 'revenus' | 'allocation';
};

export default function RevenusTrackingClient({
  monthlyIncomes,
  incomeSummary,
  allIncomes,
  month,
  monthlyAllocations,
  sectionActuals,
  sections,
  projects,
  initialTab = 'revenus',
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'revenus' | 'allocation'>(initialTab);

  // ── Income tab state ──────────────────────────────────────────────────────
  const [receiveModal, setReceiveModal] = useState<{ income: MonthlyIncome | null; variableIncome: Income | null } | null>(null);
  const [receiveAmount, setReceiveAmount] = useState('');
  const [adhocModal, setAdhocModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<MonthlyIncome | null>(null);
  const [updateAmountModal, setUpdateAmountModal] = useState<MonthlyIncome | null>(null);
  const [updateAmount, setUpdateAmount] = useState('');

  // ── Allocation tab state ──────────────────────────────────────────────────
  const [overrideModal, setOverrideModal] = useState<MonthlyAllocation | null>(null);
  const [overrideAmount, setOverrideAmount] = useState('');
  const [overrideNote, setOverrideNote] = useState('');
  const [adhocAllocModal, setAdhocAllocModal] = useState(false);

  const today = currentMonthKey();
  const isCurrentMonth = month === today;

  // Variable incomes not yet in monthly_incomes for this month
  const variableIncomes = allIncomes.filter(i => i.frequency === 'VARIABLE');
  const variableInMonthly = new Set(monthlyIncomes.map(mi => mi.income_id));
  const unregisteredVariables = variableIncomes.filter(i => !variableInMonthly.has(i.id));

  const progressPct = incomeSummary.expectedTotal > 0
    ? (incomeSummary.actualTotal / incomeSummary.expectedTotal) * 100
    : 0;
  const isComplete = progressPct >= 100 && incomeSummary.expectedTotal > 0;
  const isOverIncome = incomeSummary.actualTotal > incomeSummary.expectedTotal && incomeSummary.expectedTotal > 0;
  const surplus = incomeSummary.actualTotal - incomeSummary.expectedTotal;

  // ── Allocation calculations ───────────────────────────────────────────────
  const totalAllocated = monthlyAllocations.reduce((s, a) => s + Number(a.allocated_amount), 0);
  const disponibleAttendu = incomeSummary.expectedTotal - totalAllocated;
  const isOverAllocated = disponibleAttendu < 0;

  const sectionActualsMap = new Map(sectionActuals.map(s => [s.section_id, s.total]));

  // ── Income tab handlers ───────────────────────────────────────────────────
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

  // ── Allocation override handler ───────────────────────────────────────────
  function openOverride(alloc: MonthlyAllocation) {
    setOverrideAmount(String(alloc.allocated_amount));
    setOverrideNote(alloc.notes ?? '');
    setOverrideModal(alloc);
  }

  function confirmOverride() {
    if (!overrideModal) return;
    const amt = parseFloat(overrideAmount);
    if (isNaN(amt) || amt < 0) return;
    startTransition(async () => {
      await updateMonthlyAllocation(overrideModal.id, amt, overrideNote || null);
      setOverrideModal(null);
      setOverrideAmount('');
      setOverrideNote('');
      router.refresh();
    });
  }

  // ── Monument status badge helpers ─────────────────────────────────────────
  function getMonumentStatus() {
    if (incomeSummary.expectedTotal === 0) return null;
    if (isOverIncome) return {
      type: 'over' as const,
      label: `+${formatCAD(surplus)} au-dessus des attentes`,
    };
    if (isComplete) return { type: 'complete' as const, label: 'Tous les revenus reçus' };
    if (progressPct >= 50) return { type: 'partial' as const, label: `${Math.round(progressPct)}% reçu` };
    return { type: 'expected' as const, label: `${Math.round(progressPct)}% reçu` };
  }
  const monumentStatus = getMonumentStatus();

  // ── Progress fill color ───────────────────────────────────────────────────
  function getProgressFillColor() {
    if (isComplete || isOverIncome) return 'var(--teal-700, #0F766E)';
    if (progressPct >= 80) return 'var(--amber-500, #F59E0B)';
    return 'var(--teal-700, #0F766E)';
  }

  return (
    <div style={{ paddingBottom: '96px', minHeight: '100vh' }}>

      {/* ── MONTH NAVIGATOR ─────────────────────────────────────────────── */}
      <MonthNavigator month={month} basePath="/revenus" />

      {/* ── MONUMENT: THE SCOREBOARD ─────────────────────────────────────── */}
      <div style={{
        padding: '20px 20px 20px',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          color: 'var(--teal-700, #0F766E)',
          marginBottom: '12px',
        }}>
          Revenus
        </p>

        {/* Scoreboard fraction: received / expected */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          lineHeight: 1,
        }}>
          {/* Received — dominant, 800 weight */}
          <span style={{
            fontSize: 'clamp(3rem, 12vw, 5rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: 'var(--slate-900, #0F172A)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {incomeSummary.actualTotal.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            <span style={{
              fontSize: '0.4em',
              fontWeight: 600,
              color: 'var(--teal-700, #0F766E)',
              verticalAlign: 'super',
              marginLeft: '2px',
            }}>$</span>
          </span>

          {/* Slash — lightweight separator */}
          <span style={{
            fontSize: 'clamp(2rem, 8vw, 3.5rem)',
            fontWeight: 300,
            color: 'var(--slate-300, #CBD5E1)',
            margin: '0 clamp(4px, 1.5vw, 10px)',
            position: 'relative' as const,
            top: '-0.05em',
          }}>
            /
          </span>

          {/* Expected — subordinate, 600 weight, muted */}
          <span style={{
            fontSize: 'clamp(1.8rem, 7vw, 3rem)',
            fontWeight: 600,
            letterSpacing: '-0.03em',
            color: 'var(--slate-400, #94A3B8)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {incomeSummary.expectedTotal.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            <span style={{
              fontSize: '0.4em',
              fontWeight: 600,
              color: 'var(--teal-700, #0F766E)',
              verticalAlign: 'super',
              marginLeft: '2px',
            }}>$</span>
          </span>
        </div>

        <p style={{
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--slate-500, #64748B)',
          marginTop: '8px',
          letterSpacing: '0.01em',
        }}>
          reçu sur attendu ce mois-ci
        </p>

        {/* Progress bar */}
        {incomeSummary.expectedTotal > 0 && (
          <div style={{ margin: '16px auto 0', maxWidth: '240px' }}>
            <div style={{
              height: '6px',
              background: 'var(--slate-100, #F1F5F9)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                borderRadius: '3px',
                width: `${Math.min(progressPct, 100)}%`,
                background: getProgressFillColor(),
                transition: 'width 0.8s ease',
              }} />
            </div>

            {/* Status badge */}
            {monumentStatus && (
              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '100px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: monumentStatus.type === 'partial' || monumentStatus.type === 'expected'
                    ? 'var(--warning-light, #FEF3C7)'
                    : 'var(--success-light, #ECFDF5)',
                  color: monumentStatus.type === 'partial' || monumentStatus.type === 'expected'
                    ? 'var(--amber-600, #D97706)'
                    : 'var(--success, #059669)',
                }}>
                  {(monumentStatus.type === 'complete' || monumentStatus.type === 'over') && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {monumentStatus.label}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── TABS — underline style ───────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        margin: '0 20px',
        borderBottom: '2px solid var(--slate-100, #F1F5F9)',
        marginBottom: '20px',
      }}>
        {(['revenus', 'allocation'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '12px 16px',
              textAlign: 'center' as const,
              fontSize: '14px',
              fontWeight: 600,
              color: activeTab === tab ? 'var(--teal-700, #0F766E)' : 'var(--slate-400, #94A3B8)',
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              position: 'relative' as const,
              transition: 'color 0.2s ease',
              letterSpacing: '-0.01em',
            }}
          >
            {tab === 'revenus' ? 'Revenus' : 'Allocation'}
            {activeTab === tab && (
              <span style={{
                position: 'absolute' as const,
                bottom: '-2px',
                left: '16px',
                right: '16px',
                height: '2px',
                background: 'var(--teal-700, #0F766E)',
                borderRadius: '1px 1px 0 0',
                display: 'block',
              }} />
            )}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT wrapper ──────────────────────────────────────────── */}
      <div style={{ padding: '0 20px' }}>

        {/* ── TAB: REVENUS ─────────────────────────────────────────────── */}
        {activeTab === 'revenus' && (
          <>
            {(() => {
              const expectedIncomes = monthlyIncomes.filter(mi => Number(mi.expected_amount ?? 0) > 0);
              const adhocIncomes = monthlyIncomes.filter(mi => Number(mi.expected_amount ?? 0) === 0);
              const totalCount = monthlyIncomes.length + unregisteredVariables.length;

              if (totalCount === 0) return (
                <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', textAlign: 'center' as const, padding: '80px 0' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.5 }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--slate-300, #CBD5E1)' }}>
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                  </div>
                  <p style={{ color: 'var(--slate-400, #94A3B8)', fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                    Aucun revenu ce mois
                  </p>
                  <p style={{ color: 'var(--slate-300, #CBD5E1)', fontSize: '12px' }}>
                    Les revenus récurrents apparaissent automatiquement
                  </p>
                </div>
              );

              return (
                <>
                  {/* Expected incomes section */}
                  {(expectedIncomes.length > 0 || unregisteredVariables.length > 0) && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <p style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase' as const,
                          color: 'var(--teal-700, #0F766E)',
                          paddingLeft: '4px',
                        }}>
                          Revenus attendus ({expectedIncomes.length + unregisteredVariables.length})
                        </p>
                        {/* Desktop: inline add button */}
                        {isCurrentMonth && (
                          <button
                            onClick={() => setAdhocModal(true)}
                            style={{
                              display: 'none', // shown via CSS in desktop context via globals
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 16px',
                              background: 'var(--teal-700, #0F766E)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 'var(--radius-md, 12px)',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              letterSpacing: '-0.01em',
                            }}
                            className="desktop-add-income-btn"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Revenu ponctuel
                          </button>
                        )}
                      </div>
                      <div style={{
                        background: 'white',
                        border: '1px solid var(--slate-200, #E2E8F0)',
                        borderRadius: 'var(--radius-lg, 18px)',
                        overflow: 'hidden',
                      }}>
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

                  {/* Adhoc / ponctuel incomes section */}
                  {adhocIncomes.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase' as const,
                        color: 'var(--teal-700, #0F766E)',
                        marginBottom: '10px',
                        paddingLeft: '4px',
                      }}>
                        Revenus ponctuels ({adhocIncomes.length})
                      </p>
                      <div style={{
                        background: 'white',
                        border: '1px solid var(--slate-200, #E2E8F0)',
                        borderRadius: 'var(--radius-lg, 18px)',
                        overflow: 'hidden',
                      }}>
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

            {/* Adhoc FAB — mobile, current month only */}
            {isCurrentMonth && (
              <button
                onClick={() => setAdhocModal(true)}
                className="fab"
                aria-label="Ajouter un revenu ponctuel"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            )}
          </>
        )}

        {/* ── TAB: ALLOCATION ──────────────────────────────────────────── */}
        {activeTab === 'allocation' && (
          <>
            {/* Summary card: Total alloué / Dispo. attendu */}
            <div style={{
              background: 'white',
              border: '1px solid var(--slate-200, #E2E8F0)',
              borderRadius: 'var(--radius-lg, 18px)',
              padding: '20px',
              marginBottom: '0',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1px 1fr',
                alignItems: 'center',
              }}>
                {/* Total alloué */}
                <div style={{ textAlign: 'center' as const }}>
                  <p style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const,
                    color: 'var(--slate-400, #94A3B8)',
                    marginBottom: '4px',
                  }}>
                    Total alloué
                  </p>
                  <p style={{
                    fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    color: 'var(--slate-900, #0F172A)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {formatCAD(totalAllocated)}
                  </p>
                </div>

                {/* Divider */}
                <div style={{ width: '1px', height: '40px', background: 'var(--slate-200, #E2E8F0)', margin: '0 auto' }} />

                {/* Dispo. attendu */}
                <div style={{ textAlign: 'center' as const }}>
                  <p style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const,
                    color: 'var(--slate-400, #94A3B8)',
                    marginBottom: '4px',
                  }}>
                    Dispo. attendu
                  </p>
                  <p style={{
                    fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    color: isOverAllocated ? 'var(--error, #DC2626)' : 'var(--success, #059669)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {formatCAD(disponibleAttendu)}
                  </p>
                </div>
              </div>
            </div>

            {/* Surallocation alert — standalone banner */}
            {isOverAllocated && (
              <div style={{
                margin: '12px 0 0',
                padding: '12px 16px',
                background: 'var(--error-light, #FEF2F2)',
                border: '1px solid rgba(220, 38, 38, 0.12)',
                borderRadius: 'var(--radius-md, 12px)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--error, #DC2626)', flexShrink: 0, marginTop: '1px' }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div>
                  <p style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--error, #DC2626)',
                    lineHeight: 1.45,
                  }}>
                    Surallocation de {formatCAD(Math.abs(disponibleAttendu))}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'rgba(220, 38, 38, 0.7)',
                    marginTop: '2px',
                  }}>
                    Le total alloué dépasse le revenu attendu
                  </p>
                </div>
              </div>
            )}

            {/* Envelopes list */}
            {monthlyAllocations.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', textAlign: 'center' as const, padding: '60px 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.5 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--slate-300, #CBD5E1)' }}>
                    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  </svg>
                </div>
                <p style={{ color: 'var(--slate-400, #94A3B8)', fontSize: '14px', fontWeight: 500, marginBottom: '6px' }}>
                  Aucune enveloppe configurée
                </p>
                <a
                  href="/parametres/allocation"
                  style={{
                    fontSize: '13px',
                    color: 'var(--teal-700, #0F766E)',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  → Configurer dans les Réglages
                </a>
              </div>
            ) : (
              <div style={{
                background: 'white',
                border: '1px solid var(--slate-200, #E2E8F0)',
                borderRadius: 'var(--radius-lg, 18px)',
                overflow: 'hidden',
                marginTop: '20px',
              }}>
                {monthlyAllocations.map((alloc, i) => {
                  const hasSectionLink = !!alloc.section_id;
                  const hasProjectLink = !!alloc.project_id;
                  const actualSpent = hasSectionLink ? (sectionActualsMap.get(alloc.section_id!) ?? 0) : null;
                  const isGoalReached = hasProjectLink
                    && alloc.project_target_amount !== null && alloc.project_target_amount !== undefined
                    && Number(alloc.project_saved_amount ?? 0) >= Number(alloc.project_target_amount);

                  const isUnderAllocated = actualSpent !== null && actualSpent > Number(alloc.allocated_amount);

                  const pct = hasSectionLink && actualSpent !== null && Number(alloc.allocated_amount) > 0
                    ? Math.min((actualSpent / Number(alloc.allocated_amount)) * 100, 110)
                    : hasProjectLink && alloc.project_target_amount
                      ? Math.min((Number(alloc.project_saved_amount ?? 0) / Number(alloc.project_target_amount)) * 100, 100)
                      : null;

                  // Progress bar color: ok < 80%, warn 80-100%, over > 100%
                  const barColor = hasSectionLink
                    ? (isUnderAllocated ? 'var(--error, #DC2626)'
                      : (pct !== null && pct >= 80) ? 'var(--warning, #F59E0B)'
                      : 'var(--teal-700, #0F766E)')
                    : 'var(--teal-700, #0F766E)';

                  const barPctClass = isUnderAllocated ? 'over'
                    : (pct !== null && pct >= 80) ? 'warn'
                    : 'ok';

                  return (
                    <div
                      key={alloc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        padding: '14px 16px',
                        gap: '12px',
                        borderBottom: i < monthlyAllocations.length - 1 ? '1px solid var(--slate-100, #F1F5F9)' : 'none',
                      }}
                    >
                      {/* Color dot */}
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: alloc.color,
                        flexShrink: 0,
                        marginTop: '5px',
                      }} />

                      {/* Envelope info + progress bar */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' as const }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'var(--slate-900, #0F172A)',
                            letterSpacing: '-0.01em',
                          }}>
                            {alloc.label}
                          </span>
                          {/* Badges */}
                          {isGoalReached && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase' as const,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'var(--teal-50, #F0FDFA)',
                              color: 'var(--teal-700, #0F766E)',
                            }}>
                              Épargne
                            </span>
                          )}
                          {isUnderAllocated && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase' as const,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'var(--error-light, #FEF2F2)',
                              color: 'var(--error, #DC2626)',
                            }}>
                              Dépassé
                            </span>
                          )}
                        </div>

                        {/* Progress bar — sections */}
                        {hasSectionLink && actualSpent !== null && (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{
                              height: '6px',
                              background: 'var(--slate-100, #F1F5F9)',
                              borderRadius: '3px',
                              overflow: 'hidden',
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${Math.min(pct ?? 0, 100)}%`,
                                background: barColor,
                                borderRadius: '3px',
                                transition: 'width 0.8s ease',
                              }} />
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginTop: '4px',
                            }}>
                              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--slate-400, #94A3B8)' }}>
                                {formatCAD(actualSpent)} dépensé
                              </span>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                letterSpacing: '-0.01em',
                                color: barPctClass === 'ok' ? 'var(--teal-700, #0F766E)'
                                  : barPctClass === 'warn' ? 'var(--amber-600, #D97706)'
                                  : 'var(--error, #DC2626)',
                              }}>
                                {(pct ?? 0).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Progress bar — savings project (special: thicker, gradient, amber dot) */}
                        {hasProjectLink && !hasSectionLink && alloc.project_target_amount && !isGoalReached && (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{
                              height: '8px',
                              background: 'var(--slate-100, #F1F5F9)',
                              borderRadius: '4px',
                              overflow: 'visible',
                              position: 'relative' as const,
                            }}>
                              <div style={{
                                height: '100%',
                                width: `${pct ?? 0}%`,
                                background: 'linear-gradient(90deg, var(--teal-700, #0F766E), var(--teal-800, #115E59))',
                                borderRadius: '4px',
                                position: 'relative' as const,
                              }}>
                                {/* Amber dot at tip */}
                                <div style={{
                                  position: 'absolute' as const,
                                  right: '-6px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: '12px',
                                  height: '12px',
                                  background: 'var(--amber-500, #F59E0B)',
                                  borderRadius: '50%',
                                  border: '2px solid white',
                                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                                }} />
                              </div>
                            </div>
                            <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--slate-400, #94A3B8)', marginTop: '4px' }}>
                              {formatCAD(Number(alloc.project_saved_amount ?? 0))} / {formatCAD(Number(alloc.project_target_amount))} · {(pct ?? 0).toFixed(0)}% · {formatCAD(Number(alloc.allocated_amount))}/mois
                            </p>
                          </div>
                        )}

                        {/* Savings without target */}
                        {hasProjectLink && !alloc.project_target_amount && (
                          <p style={{ fontSize: '11px', color: 'var(--slate-400, #94A3B8)', marginTop: '4px' }}>
                            {formatCAD(Number(alloc.allocated_amount))}/mois · {formatCAD(Number(alloc.project_saved_amount ?? 0))} accumulé
                          </p>
                        )}

                        {/* Goal reached meta */}
                        {isGoalReached && (
                          <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--teal-700, #0F766E)', marginTop: '4px' }}>
                            Objectif atteint · {formatCAD(Number(alloc.allocated_amount))}/mois
                          </p>
                        )}

                        {/* Free: no tracking */}
                        {!hasSectionLink && !hasProjectLink && (
                          <p style={{ fontSize: '11px', color: 'var(--slate-400, #94A3B8)', marginTop: '4px' }}>
                            {formatCAD(Number(alloc.allocated_amount))}/mois · sans suivi
                          </p>
                        )}

                        {/* Override note */}
                        {alloc.notes && (
                          <p style={{ fontSize: '10px', color: 'var(--slate-400, #94A3B8)', marginTop: '2px', fontStyle: 'italic' }}>
                            Note : {alloc.notes}
                          </p>
                        )}
                      </div>

                      {/* Amounts column + edit button */}
                      <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                        <span style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          letterSpacing: '-0.02em',
                          color: 'var(--slate-900, #0F172A)',
                          fontVariantNumeric: 'tabular-nums',
                        }}>
                          {formatCAD(Number(alloc.allocated_amount))}
                        </span>
                        {isCurrentMonth && (
                          <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => openOverride(alloc)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'var(--slate-100, #F1F5F9)',
                                color: 'var(--slate-400, #94A3B8)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = 'var(--teal-50, #F0FDFA)';
                                (e.currentTarget as HTMLButtonElement).style.color = 'var(--teal-700, #0F766E)';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background = 'var(--slate-100, #F1F5F9)';
                                (e.currentTarget as HTMLButtonElement).style.color = 'var(--slate-400, #94A3B8)';
                              }}
                              aria-label="Modifier pour ce mois"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Reste libre card — the anchor of allocation view */}
            <div style={{
              margin: '20px 0 0',
              background: isOverAllocated ? 'var(--error-light, #FEF2F2)' : 'var(--teal-50, #F0FDFA)',
              border: isOverAllocated
                ? '1px solid rgba(220, 38, 38, 0.1)'
                : '1px solid rgba(15, 118, 110, 0.1)',
              borderRadius: 'var(--radius-lg, 18px)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Icon container */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: isOverAllocated ? 'var(--error, #DC2626)' : 'var(--teal-700, #0F766E)',
                  borderRadius: 'var(--radius-sm, 8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0,
                }}>
                  {isOverAllocated ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  )}
                </div>
                <div>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'var(--slate-900, #0F172A)',
                    letterSpacing: '-0.01em',
                  }}>
                    Reste libre
                  </p>
                  <p style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--slate-500, #64748B)',
                    marginTop: '1px',
                  }}>
                    {isOverAllocated ? 'Enveloppes en excès' : 'Non encore alloué'}
                  </p>
                </div>
              </div>

              {/* Amount */}
              <p style={{
                fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: isOverAllocated ? 'var(--error, #DC2626)' : 'var(--teal-700, #0F766E)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {Math.abs(disponibleAttendu).toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                <span style={{
                  fontSize: '0.5em',
                  fontWeight: 600,
                  verticalAlign: 'super',
                  marginLeft: '1px',
                }}>$</span>
              </p>
            </div>

            {/* Link to settings */}
            <div style={{ textAlign: 'center' as const, marginTop: '24px' }}>
              <a
                href="/parametres/allocation"
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--slate-400, #94A3B8)',
                  textDecoration: 'none',
                }}
              >
                Gérer les enveloppes dans les Réglages →
              </a>
            </div>

            {/* Adhoc allocation FAB — current month only */}
            {isCurrentMonth && (
              <button
                onClick={() => setAdhocAllocModal(true)}
                className="fab"
                aria-label="Ajouter une allocation ponctuelle"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            )}
          </>
        )}

      </div>{/* /tab content wrapper */}

      {/* ── Modals ────────────────────────────────────────────────────────── */}

      {/* Adhoc allocation modal */}
      {adhocAllocModal && (
        <AdhocAllocationModal
          month={month}
          sections={sections}
          projects={projects}
          onClose={() => { setAdhocAllocModal(false); router.refresh(); }}
        />
      )}

      {/* Mark received modal */}
      {receiveModal && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setReceiveModal(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding: '8px 24px 32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--slate-900, #0F172A)', letterSpacing: '-0.02em', marginBottom: '20px' }}>
                Marquer reçu
              </h2>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '14px', color: 'var(--slate-500, #64748B)', marginBottom: '4px' }}>
                  {receiveModal.income?.income_name ?? receiveModal.variableIncome?.name}
                </p>
                <label className="field-label" style={{ marginTop: '16px', display: 'block' }}>Montant réellement reçu ($)</label>
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
                style={{ width: '100%', padding: '16px', fontSize: '15px' }}
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
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--slate-900, #0F172A)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
                Supprimer ce revenu ?
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--slate-400, #94A3B8)', marginBottom: '24px' }}>
                {deleteModal.income_name} sera retiré de ce mois. Cette action est irréversible.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
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
                    background: 'var(--error, #DC2626)', color: 'white',
                    border: 'none', borderRadius: 'var(--radius-md, 12px)',
                    fontSize: '15px', fontWeight: 650, cursor: 'pointer',
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
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--slate-900, #0F172A)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                Modifier le montant attendu
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--slate-400, #94A3B8)', marginBottom: '20px' }}>
                Ce mois uniquement — le gabarit dans les réglages reste inchangé.
              </p>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '14px', color: 'var(--slate-500, #64748B)', marginBottom: '4px' }}>
                  {updateAmountModal.income_name}
                </p>
                <label className="field-label" style={{ marginTop: '16px', display: 'block' }}>Nouveau montant attendu ($)</label>
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
                style={{ width: '100%', padding: '16px', fontSize: '15px' }}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override monthly allocation modal */}
      {overrideModal && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setOverrideModal(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding: '8px 24px 32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--slate-900, #0F172A)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                Modifier pour ce mois
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--slate-400, #94A3B8)', marginBottom: '20px' }}>
                Ce mois uniquement — le gabarit dans les Réglages reste inchangé.
              </p>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '14px', color: 'var(--slate-500, #64748B)', fontWeight: 600, marginBottom: '12px' }}>
                  {overrideModal.label}
                </p>
                <label className="field-label">Montant alloué ce mois ($)</label>
                <input
                  type="number" min="0" step="0.01"
                  value={overrideAmount}
                  onChange={(e) => setOverrideAmount(e.target.value)}
                  className="input-field"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label className="field-label">Note (optionnel)</label>
                <input
                  type="text"
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  placeholder="Ex: Mois de 3 paies, budget serré..."
                  className="input-field"
                />
              </div>
              <button
                onClick={confirmOverride}
                className="btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '15px' }}
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
