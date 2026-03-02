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

  return (
    <div style={{ padding: '0 0 96px', minHeight: '100vh' }}>
      {/* Monument — revenus du mois */}
      <div style={{ padding: '24px 20px 16px', textAlign: 'center' }}>
        <p style={{
          fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '4px',
        }}>
          Revenus
        </p>
        <p style={{
          fontSize: 'clamp(3rem, 12vw, 5rem)', fontWeight: 800,
          letterSpacing: '-0.03em', lineHeight: 1, margin: '8px 0 12px',
          color: 'var(--text-primary)',
        }}>
          <span style={{ fontSize: '0.4em', color: 'var(--accent)', verticalAlign: 'super' }}>$</span>
          {incomeSummary.actualTotal.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          sur <strong style={{ color: 'var(--text-primary)' }}>{formatCAD(incomeSummary.expectedTotal)}</strong> attendus ce mois-ci
        </p>
        {/* Progress bar */}
        <div style={{
          height: '6px', borderRadius: '3px', overflow: 'hidden',
          background: 'var(--surface-sunken)', marginBottom: '8px',
          position: 'relative',
        }}>
          {isOverIncome ? (
            <>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${(incomeSummary.expectedTotal / incomeSummary.actualTotal) * 100}%`,
                background: 'var(--accent)',
              }} />
              <div style={{
                position: 'absolute',
                left: `${(incomeSummary.expectedTotal / incomeSummary.actualTotal) * 100}%`,
                top: 0, bottom: 0,
                width: `${(surplus / incomeSummary.actualTotal) * 100}%`,
                background: 'var(--amber)',
              }} />
            </>
          ) : (
            <div style={{
              height: '100%',
              background: progressPct >= 80 ? 'var(--accent)' : progressPct >= 40 ? 'var(--amber)' : 'var(--surface-border)',
              width: `${Math.min(progressPct, 100)}%`,
              transition: 'width 0.3s ease',
            }} />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {isOverIncome ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', borderRadius: '999px',
              background: 'var(--positive-subtle)', color: 'var(--accent)',
              fontSize: 'var(--text-xs)', fontWeight: 600,
            }}>
              ✦ +{formatCAD(surplus)} au-dessus des attentes
            </span>
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', borderRadius: '999px',
              background: progressPct >= 80 ? 'var(--positive-subtle)' : 'var(--surface-inset)',
              color: progressPct >= 80 ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 'var(--text-xs)', fontWeight: 600,
            }}>
              {progressPct >= 80 ? '✓ Objectif presque atteint' : `${Math.round(progressPct)}% reçu`}
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
      <MonthNavigator month={month} basePath="/revenus" />
      </div>

      <div style={{ padding: '0 20px' }}>
      {/* Tab strip — Patrimoine style, below hero card */}
      <div className="flex" style={{
        gap: '6px', marginBottom: '20px', marginTop: '16px',
        background: 'var(--surface-inset)',
        borderRadius: 'var(--radius-md)',
        padding: '4px',
      }}>
        {(['revenus', 'allocation'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-sm)', fontWeight: 650,
              cursor: 'pointer',
              background: activeTab === tab ? 'var(--surface-raised)' : 'transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: 'none',
              boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {tab === 'revenus' ? 'Revenus' : 'Allocation'}
          </button>
        ))}
      </div>

      {/* ── TAB: REVENUS ──────────────────────────────────────────────────── */}
      {activeTab === 'revenus' && (
        <>
          {/* Incomes list */}
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
        </>
      )}

      {/* ── TAB: ALLOCATION ───────────────────────────────────────────────── */}
      {activeTab === 'allocation' && (
        <>
          {/* Hero card */}
          <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
            <div className="flex" style={{ gap: '0', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: '4px' }}>
                  Total alloué
                </p>
                <p className="amount" style={{ fontSize: 'var(--text-lg)', fontWeight: 750 }}>
                  {formatCAD(totalAllocated)}
                </p>
              </div>
              <div style={{ width: '1px', background: 'var(--border)', margin: '0 12px' }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: '4px' }}>
                  Dispo. attendu
                </p>
                <p className="amount" style={{
                  fontSize: 'var(--text-lg)', fontWeight: 750,
                  color: isOverAllocated ? 'var(--warning-text)' : 'var(--positive)',
                }}>
                  {formatCAD(disponibleAttendu)}
                </p>
              </div>
            </div>
            {isOverAllocated && (
              <div style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--warning-subtle)',
                fontSize: 'var(--text-xs)',
                color: 'var(--warning-text)',
                fontWeight: 600,
              }}>
                ⚠ Surallocation de {formatCAD(Math.abs(disponibleAttendu))} — le total alloué dépasse le revenu attendu
              </div>
            )}
          </div>

          {/* Envelopes list */}
          {monthlyAllocations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center" style={{ padding: '60px 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.5 }}>🗂️</div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: '6px' }}>
                Aucune enveloppe configurée
              </p>
              <a
                href="/parametres/allocation"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                → Configurer dans les Réglages
              </a>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {monthlyAllocations.map((alloc, i) => {
                const hasSectionLink = !!alloc.section_id;
                const hasProjectLink = !!alloc.project_id;
                const actualSpent = hasSectionLink ? (sectionActualsMap.get(alloc.section_id!) ?? 0) : null;
                const isGoalReached = hasProjectLink
                  && alloc.project_target_amount !== null && alloc.project_target_amount !== undefined
                  && Number(alloc.project_saved_amount ?? 0) >= Number(alloc.project_target_amount);

                // Under-allocation warning: allocated < actual spent for this section
                const isUnderAllocated = actualSpent !== null && actualSpent > Number(alloc.allocated_amount);

                const pct = hasSectionLink && actualSpent !== null && Number(alloc.allocated_amount) > 0
                  ? Math.min((actualSpent / Number(alloc.allocated_amount)) * 100, 110)
                  : hasProjectLink && alloc.project_target_amount
                    ? Math.min((Number(alloc.project_saved_amount ?? 0) / Number(alloc.project_target_amount)) * 100, 100)
                    : null;

                return (
                  <div
                    key={alloc.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom: i < monthlyAllocations.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div className="flex items-center" style={{ gap: '10px' }}>
                      <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: alloc.color, flexShrink: 0,
                      }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center" style={{ gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                            {alloc.label}
                          </span>
                          {isGoalReached && (
                            <span className="badge" style={{ background: 'var(--positive-subtle)', color: 'var(--positive)', fontSize: '10px' }}>
                              ✓ Objectif atteint
                            </span>
                          )}
                          {isUnderAllocated && (
                            <span className="badge" style={{ background: 'var(--warning-subtle)', color: 'var(--warning-text)', fontSize: '10px' }}>
                              ⚠ Sous-alloué
                            </span>
                          )}
                        </div>

                        {/* Charges: progress vs spent */}
                        {hasSectionLink && actualSpent !== null && (
                          <div style={{ marginTop: '6px' }}>
                            <div style={{ height: '4px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: `${Math.min(pct ?? 0, 100)}%`,
                                background: isUnderAllocated ? 'var(--warning-text)' : alloc.color,
                                borderRadius: '2px',
                                transition: 'width 0.3s ease',
                              }} />
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '3px' }}>
                              {formatCAD(actualSpent)} dépensé / {formatCAD(Number(alloc.allocated_amount))} alloué
                            </div>
                          </div>
                        )}

                        {/* Savings: project progress */}
                        {hasProjectLink && !hasSectionLink && alloc.project_target_amount && !isGoalReached && (
                          <div style={{ marginTop: '6px' }}>
                            <div style={{ height: '4px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%',
                                width: `${pct ?? 0}%`,
                                background: alloc.color,
                                borderRadius: '2px',
                              }} />
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '3px' }}>
                              {formatCAD(Number(alloc.project_saved_amount ?? 0))} / {formatCAD(Number(alloc.project_target_amount))} · {(pct ?? 0).toFixed(0)}%
                              {' · '}{formatCAD(Number(alloc.allocated_amount))}/mois
                            </div>
                          </div>
                        )}

                        {/* Free: no tracking */}
                        {!hasSectionLink && !hasProjectLink && (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '3px' }}>
                            {formatCAD(Number(alloc.allocated_amount))}/mois · sans suivi
                          </div>
                        )}

                        {/* Savings without target */}
                        {hasProjectLink && !alloc.project_target_amount && (
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '3px' }}>
                            {formatCAD(Number(alloc.allocated_amount))}/mois · {formatCAD(Number(alloc.project_saved_amount ?? 0))} accumulé
                          </div>
                        )}

                        {/* Override note */}
                        {alloc.notes && (
                          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px', fontStyle: 'italic' }}>
                            Note : {alloc.notes}
                          </div>
                        )}
                      </div>

                      {/* Amount + override button */}
                      <div className="flex items-center" style={{ gap: '8px', flexShrink: 0 }}>
                        <span className="amount" style={{ fontSize: 'var(--text-sm)' }}>
                          {formatCAD(Number(alloc.allocated_amount))}
                        </span>
                        {isCurrentMonth && (
                          <button
                            onClick={() => openOverride(alloc)}
                            style={{
                              padding: '6px',
                              color: 'var(--text-tertiary)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              borderRadius: 'var(--radius-sm)',
                            }}
                            aria-label="Modifier pour ce mois"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Link to settings */}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <a
              href="/parametres/allocation"
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                textDecoration: 'none',
                fontWeight: 500,
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
              style={{ bottom: 'calc(var(--nav-height) + var(--safe-bottom) + 16px)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
        </>
      )}

      </div>{/* /padding wrapper */}

      {/* Adhoc allocation modal */}
      {adhocAllocModal && (
        <AdhocAllocationModal
          month={month}
          sections={sections}
          projects={projects}
          onClose={() => { setAdhocAllocModal(false); router.refresh(); }}
        />
      )}

      {/* ── Modals ────────────────────────────────────────────────────────── */}

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
                <button onClick={() => setDeleteModal(null)} className="btn-secondary" style={{ flex: 1, padding: '14px' }}>
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

      {/* Override monthly allocation modal */}
      {overrideModal && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setOverrideModal(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding: '8px 24px 32px' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Modifier pour ce mois
              </h2>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
                Ce mois uniquement — le gabarit dans les Réglages reste inchangé.
              </p>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '12px' }}>
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
