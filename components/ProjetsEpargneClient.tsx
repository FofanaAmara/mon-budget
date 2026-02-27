'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteExpense } from '@/lib/actions/expenses';
import { deleteDebt, makeExtraPayment } from '@/lib/actions/debts';
import { formatCAD, calcMonthlySuggested, formatDate } from '@/lib/utils';
import ProjectModal from '@/components/ProjectModal';
import DebtModal from '@/components/DebtModal';
import AddSavingsModal from '@/components/AddSavingsModal';
import SavingsHistoryModal from '@/components/SavingsHistoryModal';
import TransferSavingsModal from '@/components/TransferSavingsModal';
import type { Expense, Section, Card, Debt } from '@/lib/types';

const FREQ_LABELS: Record<string, string> = {
  WEEKLY: '/sem',
  BIWEEKLY: '/2 sem',
  MONTHLY: '/mois',
  QUARTERLY: '/trim',
  YEARLY: '/an',
};

type Tab = 'actifs' | 'passifs';

type Props = {
  projets: Expense[];
  sections: Section[];
  cards: Card[];
  freeSavings: Expense;
  debts: Debt[];
  totalDebtBalance: number;
};

export default function ProjetsEpargneClient({ projets, sections, cards, freeSavings, debts, totalDebtBalance }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<Tab>('actifs');
  const [createModal, setCreateModal] = useState(false);
  const [debtModal, setDebtModal] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [extraPayDebt, setExtraPayDebt] = useState<Debt | null>(null);
  const [extraPayAmount, setExtraPayAmount] = useState('');
  const [savingsModal, setSavingsModal] = useState<Expense | null>(null);
  const [historyModal, setHistoryModal] = useState<Expense | null>(null);
  const [transferModal, setTransferModal] = useState<Expense | null>(null);
  const [fabOpen, setFabOpen] = useState(false);

  const allPots = [freeSavings, ...projets];

  const freeSaved = Number(freeSavings.saved_amount ?? 0);
  const projectsSaved = projets.reduce((s, p) => s + Number(p.saved_amount ?? 0), 0);
  const totalEpargne = freeSaved + projectsSaved;
  const valeurNette = totalEpargne - totalDebtBalance;

  async function handleDelete(id: string) {
    if (confirm('Supprimer ce projet ?')) {
      startTransition(async () => {
        await deleteExpense(id);
        router.refresh();
      });
    }
  }

  async function handleDeleteDebt(id: string) {
    if (confirm('Supprimer cette dette ?')) {
      startTransition(async () => {
        await deleteDebt(id);
        router.refresh();
      });
    }
  }

  async function handleExtraPayment() {
    if (!extraPayDebt || !extraPayAmount) return;
    const amount = parseFloat(extraPayAmount);
    if (isNaN(amount) || amount <= 0) return;
    startTransition(async () => {
      await makeExtraPayment(extraPayDebt.id, amount);
      setExtraPayDebt(null);
      setExtraPayAmount('');
      router.refresh();
    });
  }

  function handleSavingsDone() {
    setSavingsModal(null);
    router.refresh();
  }

  return (
    <div style={{ padding: '36px 20px 96px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: 'var(--text-xl)', fontWeight: 750,
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
        }}>
          Patrimoine
        </h1>
      </div>

      {/* Valeur nette — hero card (always visible) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
        <div className="card" style={{
          padding: '16px 20px',
          background: valeurNette >= 0
            ? 'linear-gradient(135deg, #059669, #047857)'
            : 'linear-gradient(135deg, #DC2626, #B91C1C)',
          color: 'white',
          borderColor: 'transparent',
        }}>
          <p style={{
            fontSize: 'var(--text-xs)', fontWeight: 600, opacity: 0.75,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px',
          }}>
            Valeur nette
          </p>
          <p className="amount" style={{ fontSize: 'var(--text-xl)', fontWeight: 750 }}>
            {valeurNette >= 0 ? '+' : ''}{formatCAD(valeurNette)}
          </p>
          <p style={{ fontSize: 'var(--text-xs)', opacity: 0.7, marginTop: '4px' }}>
            Actifs: {formatCAD(totalEpargne)} | Passifs: {formatCAD(totalDebtBalance)}
          </p>
        </div>
      </div>

      {/* Tab strip */}
      <div className="flex" style={{
        gap: '6px', marginBottom: '20px',
        background: 'var(--surface-inset)',
        borderRadius: 'var(--radius-md)',
        padding: '4px',
      }}>
        {([
          { key: 'actifs' as Tab, label: 'Actifs', amount: totalEpargne },
          { key: 'passifs' as Tab, label: 'Passifs', amount: totalDebtBalance },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-sm)', fontWeight: 650,
              cursor: 'pointer',
              background: activeTab === tab.key ? 'var(--surface-raised)' : 'transparent',
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: 'none',
              boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            {tab.label}
            <span className="amount" style={{
              fontSize: 'var(--text-xs)', fontWeight: 600,
              color: activeTab === tab.key
                ? (tab.key === 'actifs' ? 'var(--positive)' : 'var(--negative-text)')
                : 'var(--text-tertiary)',
            }}>
              {formatCAD(tab.amount)}
            </span>
          </button>
        ))}
      </div>

      {/* ─── TAB ACTIFS ─── */}
      {activeTab === 'actifs' && (
        <>
          {/* Épargne libre — permanent card */}
          <div style={{ marginBottom: '24px' }}>
            <h2 className="section-label" style={{ marginBottom: '12px', paddingLeft: '4px' }}>
              Epargne libre
            </h2>
            <div className="card" style={{ padding: '20px' }}>
              <div className="flex items-center" style={{ gap: '14px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: 'var(--radius-lg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--positive-subtle)', flexShrink: 0, fontSize: '18px',
                }}>
                  💰
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                    Epargne libre
                  </p>
                </div>
                <span className="amount" style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--positive)', flexShrink: 0 }}>
                  {formatCAD(freeSaved)}
                </span>
                <div className="flex items-center" style={{ gap: '4px', flexShrink: 0 }}>
                  <button onClick={() => setSavingsModal(freeSavings)} className="icon-btn" aria-label="Ajouter epargne">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <button onClick={() => setTransferModal(freeSavings)} className="icon-btn" aria-label="Reallouer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="17 1 21 5 17 9" />
                      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                      <polyline points="7 23 3 19 7 15" />
                      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                    </svg>
                  </button>
                  <button onClick={() => setHistoryModal(freeSavings)} className="icon-btn" aria-label="Historique">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Projects with goal */}
          <div style={{ marginBottom: '24px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '12px', paddingLeft: '4px', paddingRight: '4px' }}>
              <h2 className="section-label">
                Mes projets ({projets.length})
              </h2>
            </div>

            {projets.length === 0 ? (
              <div className="card" style={{ padding: '32px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.5 }}>🎯</div>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: '4px' }}>
                  Aucun projet
                </p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', opacity: 0.7 }}>
                  Creez un projet avec un objectif d&apos;epargne
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {projets.map((projet) => {
                  const target = Number(projet.target_amount ?? 0);
                  const saved = Number(projet.saved_amount ?? 0);
                  const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
                  const monthlySuggested = projet.target_date
                    ? calcMonthlySuggested(target, saved, projet.target_date) : null;

                  return (
                    <div key={projet.id} className="card" style={{ padding: '20px' }}>
                      <div className="flex items-start justify-between" style={{ marginBottom: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                            {projet.name}
                          </p>
                          {projet.section && (
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                              {projet.section.icon} {projet.section.name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center" style={{ gap: '4px', flexShrink: 0 }}>
                          <button onClick={() => setSavingsModal(projet)} className="icon-btn" aria-label="Ajouter epargne">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                          <button onClick={() => setTransferModal(projet)} className="icon-btn" aria-label="Reallouer">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="17 1 21 5 17 9" />
                              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                              <polyline points="7 23 3 19 7 15" />
                              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                            </svg>
                          </button>
                          <button onClick={() => setHistoryModal(projet)} className="icon-btn" aria-label="Historique">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(projet.id)} className="icon-btn icon-btn-danger" aria-label="Supprimer">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="progress-track" style={{ marginBottom: '10px' }}>
                        <div className="progress-fill" style={{
                          width: `${Math.max(progress, 2)}%`,
                          background: progress >= 100 ? 'var(--positive)' : 'var(--accent)',
                        }} />
                      </div>

                      <div className="flex justify-between items-end">
                        <div>
                          <p style={{ fontSize: 'var(--text-sm)' }}>
                            <span className="amount">{formatCAD(saved)}</span>
                            <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}> / {formatCAD(target)}</span>
                          </p>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            {Math.round(progress)}% atteint
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {projet.target_date && (
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                              Cible : {formatDate(projet.target_date)}
                            </p>
                          )}
                          {monthlySuggested !== null && monthlySuggested > 0 && (
                            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 650, color: 'var(--accent)', marginTop: '2px' }}>
                              {formatCAD(monthlySuggested)}/mois suggere
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─── TAB PASSIFS ─── */}
      {activeTab === 'passifs' && (
        <div style={{ marginBottom: '24px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '12px', paddingLeft: '4px', paddingRight: '4px' }}>
            <h2 className="section-label">
              Mes dettes ({debts.length})
            </h2>
          </div>

          {debts.length === 0 ? (
            <div className="card" style={{ padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.5 }}>📉</div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: '4px' }}>
                Aucune dette
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', opacity: 0.7 }}>
                Ajoutez vos prets et dettes pour suivre votre valeur nette
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {debts.map((debt) => {
                const original = Number(debt.original_amount);
                const remaining = Number(debt.remaining_balance);
                const paid = original - remaining;
                const progress = original > 0 ? Math.min((paid / original) * 100, 100) : 0;

                return (
                  <div key={debt.id} className="card" style={{ padding: '20px' }}>
                    <div className="flex items-start justify-between" style={{ marginBottom: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 650, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
                          {debt.name}
                        </p>
                        <div className="flex items-center" style={{ gap: '8px', marginTop: '2px' }}>
                          {debt.section && (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                              {debt.section.icon} {debt.section.name}
                            </span>
                          )}
                          {debt.interest_rate != null && (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                              {debt.interest_rate}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center" style={{ gap: '4px', flexShrink: 0 }}>
                        <button onClick={() => setExtraPayDebt(debt)} className="icon-btn" aria-label="Paiement supplementaire" title="Paiement extra">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                        </button>
                        <button onClick={() => { setEditDebt(debt); setDebtModal(true); }} className="icon-btn" aria-label="Modifier">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteDebt(debt.id)} className="icon-btn icon-btn-danger" aria-label="Supprimer">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Progress bar — tracks repayment */}
                    <div className="progress-track" style={{ marginBottom: '10px' }}>
                      <div className="progress-fill" style={{
                        width: `${Math.max(progress, 2)}%`,
                        background: progress >= 100 ? 'var(--positive)' : 'var(--accent)',
                      }} />
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <p style={{ fontSize: 'var(--text-sm)' }}>
                          <span className="amount" style={{ color: 'var(--negative-text)' }}>{formatCAD(remaining)}</span>
                          <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}> / {formatCAD(original)}</span>
                        </p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          {Math.round(progress)}% rembourse
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 650, color: 'var(--text-secondary)' }}>
                          {formatCAD(Number(debt.payment_amount))}{FREQ_LABELS[debt.payment_frequency] ?? ''}
                        </p>
                        {debt.auto_debit && (
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                            Prelevement auto
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FAB — two options */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(var(--nav-height) + var(--safe-bottom) + 16px)',
        right: '20px',
        display: 'flex', flexDirection: 'column-reverse', alignItems: 'flex-end', gap: '12px',
        zIndex: 50,
      }}>
        {fabOpen && (
          <>
            <button
              onClick={() => { setFabOpen(false); setCreateModal(true); }}
              className="btn-primary"
              style={{
                padding: '10px 16px', borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)', fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              🎯 Nouveau projet
            </button>
            <button
              onClick={() => { setFabOpen(false); setEditDebt(null); setDebtModal(true); }}
              className="btn-primary"
              style={{
                padding: '10px 16px', borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-sm)', fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              📉 Nouvelle dette
            </button>
          </>
        )}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="fab"
          aria-label="Ajouter"
          style={{ position: 'relative', bottom: 0, right: 0 }}
        >
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{
              transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Backdrop when FAB menu is open */}
      {fabOpen && (
        <div
          onClick={() => setFabOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 49,
            background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Create project modal */}
      {createModal && (
        <ProjectModal
          sections={sections}
          onClose={() => { setCreateModal(false); router.refresh(); }}
        />
      )}

      {/* Debt modal (create/edit) */}
      {debtModal && (
        <DebtModal
          sections={sections}
          cards={cards}
          debt={editDebt}
          onClose={() => { setDebtModal(false); setEditDebt(null); router.refresh(); }}
        />
      )}

      {/* Extra payment modal */}
      {extraPayDebt && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setExtraPayDebt(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ padding: '8px 24px 40px' }}>
              <h2 style={{
                fontSize: 'var(--text-lg)', fontWeight: 700,
                color: 'var(--text-primary)', marginBottom: '8px',
                letterSpacing: 'var(--tracking-tight)',
              }}>
                Paiement supplementaire
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: '20px' }}>
                {extraPayDebt.name} — Solde: {formatCAD(Number(extraPayDebt.remaining_balance))}
              </p>
              <div style={{ marginBottom: '16px' }}>
                <label className="field-label">Montant ($)</label>
                <input
                  type="number" min="0.01" step="0.01" placeholder="500.00"
                  value={extraPayAmount}
                  onChange={(e) => setExtraPayAmount(e.target.value)}
                  className="input-field"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                  autoFocus
                />
              </div>
              <button
                onClick={handleExtraPayment}
                disabled={!extraPayAmount || parseFloat(extraPayAmount) <= 0}
                className="btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: 'var(--text-base)', opacity: !extraPayAmount ? 0.5 : 1 }}
              >
                Appliquer le paiement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add savings modal */}
      {savingsModal && (
        <AddSavingsModal
          expenseId={savingsModal.id}
          projectName={savingsModal.name}
          currentSaved={Number(savingsModal.saved_amount ?? 0)}
          targetAmount={savingsModal.target_amount !== null ? Number(savingsModal.target_amount) : null}
          onDone={handleSavingsDone}
          onClose={() => setSavingsModal(null)}
        />
      )}

      {/* Transfer modal */}
      {transferModal && (
        <TransferSavingsModal
          source={transferModal}
          allPots={allPots}
          onDone={() => { setTransferModal(null); router.refresh(); }}
          onClose={() => setTransferModal(null)}
        />
      )}

      {/* History modal */}
      {historyModal && (
        <SavingsHistoryModal
          expenseId={historyModal.id}
          projectName={historyModal.name}
          currentSaved={Number(historyModal.saved_amount ?? 0)}
          targetAmount={historyModal.target_amount !== null ? Number(historyModal.target_amount) : null}
          onClose={() => { setHistoryModal(null); router.refresh(); }}
        />
      )}
    </div>
  );
}
