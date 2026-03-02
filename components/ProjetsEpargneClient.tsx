'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteExpense } from '@/lib/actions/expenses';
import { deleteDebt, makeExtraPayment } from '@/lib/actions/debts';
import { addDebtTransaction } from '@/lib/actions/debt-transactions';
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
  const [createModal, setCreateModal] = useState(false);
  const [debtModal, setDebtModal] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [extraPayDebt, setExtraPayDebt] = useState<Debt | null>(null);
  const [extraPayAmount, setExtraPayAmount] = useState('');
  const [extraPayType, setExtraPayType] = useState<'regular' | 'extra'>('regular');
  const [chargeDebt, setChargeDebt] = useState<Debt | null>(null);
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeNote, setChargeNote] = useState('');
  const [savingsModal, setSavingsModal] = useState<Expense | null>(null);
  const [historyModal, setHistoryModal] = useState<Expense | null>(null);
  const [transferModal, setTransferModal] = useState<Expense | null>(null);
  const [fabOpen, setFabOpen] = useState(false);

  const allPots = [freeSavings, ...projets];

  const freeSaved = Number(freeSavings.saved_amount ?? 0);
  const projectsSaved = projets.reduce((s, p) => s + Number(p.saved_amount ?? 0), 0);
  const totalEpargne = freeSaved + projectsSaved;
  const valeurNette = totalEpargne - totalDebtBalance;
  const isPositive = valeurNette >= 0;

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
      setExtraPayType('regular');
      router.refresh();
    });
  }

  async function handleCharge() {
    if (!chargeDebt || !chargeAmount) return;
    const amount = parseFloat(chargeAmount);
    if (isNaN(amount) || amount <= 0) return;
    const now = new Date();
    const txMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    startTransition(async () => {
      await addDebtTransaction(chargeDebt.id, 'CHARGE', amount, txMonth, chargeNote || null);
      setChargeDebt(null);
      setChargeAmount('');
      setChargeNote('');
      router.refresh();
    });
  }

  function handleSavingsDone() {
    setSavingsModal(null);
    router.refresh();
  }

  return (
    <div style={{ padding: '0 0 120px', minHeight: '100vh' }}>

      {/* ── MONUMENT: Valeur nette ── */}
      <div style={{
        padding: '32px 20px 24px',
        textAlign: 'center',
        position: 'relative',
      }}>
        <p style={{
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--teal-700)',
          marginBottom: '10px',
        }}>
          Patrimoine
        </p>

        <p style={{
          fontSize: 'clamp(3rem, 12vw, 5rem)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          margin: '0 0 8px',
          color: isPositive ? 'var(--teal-700)' : 'var(--error)',
        }}>
          <span style={{
            fontSize: '0.65em',
            fontWeight: 700,
            verticalAlign: 'baseline',
          }}>
            {isPositive ? '+' : '-'}
          </span>
          <span style={{
            fontSize: '0.4em',
            fontWeight: 600,
            verticalAlign: 'super',
            marginLeft: '2px',
            color: isPositive ? 'var(--teal-800)' : 'var(--error)',
          }}>
            $
          </span>
          {Math.abs(valeurNette).toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>

        <p style={{
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--slate-400)',
          marginBottom: '12px',
          letterSpacing: '-0.01em',
        }}>
          Épargne {formatCAD(totalEpargne)} · Dettes {formatCAD(totalDebtBalance)}
        </p>

        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 14px',
          borderRadius: '100px',
          fontSize: '13px',
          fontWeight: 600,
          background: isPositive ? 'var(--success-light)' : 'var(--error-light)',
          color: isPositive ? 'var(--success, #059669)' : 'var(--error)',
        }}>
          {isPositive ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
              <polyline points="16 17 22 17 22 11" />
            </svg>
          )}
          {isPositive ? 'En croissance' : 'En déficit'}
        </span>
      </div>

      {/* ── TOTALS BAR ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2px',
        margin: '0 20px 28px',
        background: 'var(--slate-100)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 12px',
          background: 'var(--white, #fff)',
          textAlign: 'center',
          borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
        }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--slate-400)',
            marginBottom: '4px',
          }}>
            Épargne
          </p>
          <p style={{
            fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--teal-700)',
          }}>
            <span style={{ fontSize: '0.5em', fontWeight: 600, color: 'var(--teal-800)' }}>$</span>
            {totalEpargne.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--slate-400)', marginTop: '2px' }}>
            {projets.length + 1} pot{projets.length + 1 !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{
          padding: '16px 12px',
          background: 'var(--white, #fff)',
          textAlign: 'center',
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
        }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--slate-400)',
            marginBottom: '4px',
          }}>
            Dettes
          </p>
          <p style={{
            fontSize: 'clamp(1.2rem, 4vw, 1.5rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums',
            color: debts.length > 0 ? 'var(--error)' : 'var(--slate-400)',
          }}>
            <span style={{ fontSize: '0.5em', fontWeight: 600, color: debts.length > 0 ? 'var(--error)' : 'var(--slate-400)' }}>$</span>
            {totalDebtBalance.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--slate-400)', marginTop: '2px' }}>
            {debts.length} dette{debts.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── EPARGNE SECTION ── */}
      <div style={{ margin: '0 20px 32px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}>
          <h2 style={{
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--teal-700)',
          }}>
            Épargne
          </h2>
          <button
            onClick={() => setCreateModal(true)}
            className="btn-desktop-only"
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--teal-700)',
              background: 'transparent',
              border: '1.5px solid var(--teal-700)',
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nouveau projet
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Épargne libre — permanent */}
          <div style={{
            background: 'var(--white, #fff)',
            border: '1px solid var(--slate-200)',
            borderLeft: '4px solid var(--teal-700)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 18px 16px',
            transition: 'all 0.25s ease',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '12px',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--slate-900)',
                  letterSpacing: '-0.01em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                }}>
                  Épargne libre
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    background: 'var(--teal-50)',
                    color: 'var(--teal-700)',
                    borderRadius: '100px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}>
                    Permanent
                  </span>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--slate-400)',
                  }}>
                    Pot libre
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                <p style={{
                  fontSize: 'clamp(1.3rem, 5vw, 1.6rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  color: 'var(--teal-700)',
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}>
                  <span style={{ fontSize: '0.5em', fontWeight: 600, color: 'var(--teal-800)' }}>$</span>
                  {freeSaved.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button onClick={() => setSavingsModal(freeSavings)} className="icon-btn" aria-label="Ajouter épargne">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <button onClick={() => setTransferModal(freeSavings)} className="icon-btn" aria-label="Transférer">
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

          {/* Project pots */}
          {projets.length === 0 ? (
            <div className="card" style={{ padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.5 }}>🎯</div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: '4px' }}>
                Aucun projet d&apos;épargne
              </p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', opacity: 0.7 }}>
                Créez un projet avec un objectif et une date cible
              </p>
            </div>
          ) : (
            projets.map((projet) => {
              const target = Number(projet.target_amount ?? 0);
              const saved = Number(projet.saved_amount ?? 0);
              const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
              const monthlySuggested = projet.target_date
                ? calcMonthlySuggested(target, saved, projet.target_date) : null;

              return (
                <div key={projet.id} style={{
                  background: 'var(--white, #fff)',
                  border: '1px solid var(--slate-200)',
                  borderLeft: '4px solid var(--teal-700)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 18px 16px',
                  transition: 'all 0.25s ease',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: 'var(--slate-900)',
                        letterSpacing: '-0.01em',
                      }}>
                        {projet.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: 'var(--slate-400)',
                        }}>
                          Projet
                        </span>
                        {projet.target_date && (
                          <>
                            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--slate-300)', flexShrink: 0 }} />
                            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--slate-500)' }}>
                              Cible : {formatDate(projet.target_date)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                      <p style={{
                        fontSize: 'clamp(1.3rem, 5vw, 1.6rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.1,
                        color: 'var(--teal-700)',
                        fontVariantNumeric: 'tabular-nums',
                        whiteSpace: 'nowrap',
                      }}>
                        <span style={{ fontSize: '0.5em', fontWeight: 600, color: 'var(--teal-800)' }}>$</span>
                        {saved.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button onClick={() => setSavingsModal(projet)} className="icon-btn" aria-label="Ajouter épargne">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                        <button onClick={() => setTransferModal(projet)} className="icon-btn" aria-label="Transférer">
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
                  </div>

                  {/* Progress bar — 8px teal gradient with amber dot */}
                  {target > 0 && (
                    <div style={{ marginTop: '14px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', letterSpacing: '-0.01em' }}>
                          <strong style={{ fontWeight: 700, color: 'var(--slate-700)' }}>{formatCAD(saved)}</strong>
                          {' / '}{formatCAD(target)}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber-500)' }}>
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div style={{
                        height: '8px',
                        background: 'var(--slate-100)',
                        borderRadius: '4px',
                        overflow: 'visible',
                        position: 'relative',
                      }}>
                        <div style={{
                          height: '100%',
                          borderRadius: '4px',
                          background: 'linear-gradient(90deg, var(--teal-700), var(--teal-800))',
                          width: `${Math.max(progress, 2)}%`,
                          position: 'relative',
                          transition: 'width 0.8s ease',
                        }}>
                          {/* Amber dot at tip */}
                          <span style={{
                            position: 'absolute',
                            right: '-1px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '12px',
                            height: '12px',
                            background: 'var(--amber-500)',
                            borderRadius: '50%',
                            border: '2px solid white',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                            display: 'block',
                          }} />
                        </div>
                      </div>

                      {/* Monthly suggestion chip */}
                      {monthlySuggested !== null && monthlySuggested > 0 && (
                        <span suppressHydrationWarning style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '10px',
                          padding: '4px 10px',
                          background: 'var(--teal-50)',
                          border: '1px solid rgba(15, 118, 110, 0.1)',
                          borderRadius: '100px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--teal-700)',
                          letterSpacing: '0.01em',
                        }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {formatCAD(monthlySuggested)}/mois suggéré
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── DETTES SECTION ── */}
      <div style={{ margin: '0 20px 32px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}>
          <h2 style={{
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--error)',
          }}>
            Dettes
          </h2>
          <button
            onClick={() => { setEditDebt(null); setDebtModal(true); }}
            className="btn-desktop-only"
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--error)',
              background: 'transparent',
              border: '1.5px solid var(--error)',
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nouvelle dette
          </button>
        </div>

        {debts.length === 0 ? (
          <div className="card" style={{ padding: '32px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.5 }}>📉</div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: '4px' }}>
              Aucune dette
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', opacity: 0.7 }}>
              Ajoutez vos prêts et dettes pour suivre votre valeur nette
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {debts.map((debt) => {
              const remaining = Number(debt.remaining_balance);

              return (
                <div key={debt.id} style={{
                  background: 'var(--white, #fff)',
                  border: '1px solid var(--slate-200)',
                  borderLeft: '4px solid var(--error)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 18px 16px',
                  transition: 'all 0.25s ease',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: 'var(--slate-900)',
                        letterSpacing: '-0.01em',
                      }}>
                        {debt.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                        {debt.section && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: 'var(--slate-400)',
                          }}>
                            {debt.section.icon} {debt.section.name}
                          </span>
                        )}
                        {!debt.section && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: 'var(--slate-400)',
                          }}>
                            Dette
                          </span>
                        )}
                        {debt.interest_rate != null && (
                          <>
                            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--slate-300)', flexShrink: 0 }} />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--error)', letterSpacing: '-0.01em' }}>
                              {debt.interest_rate}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                      <p style={{
                        fontSize: 'clamp(1.3rem, 5vw, 1.6rem)',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        lineHeight: 1.1,
                        color: 'var(--error)',
                        fontVariantNumeric: 'tabular-nums',
                        whiteSpace: 'nowrap',
                      }}>
                        <span style={{ fontSize: '0.5em', fontWeight: 600, color: 'var(--error)' }}>$</span>
                        {remaining.toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button onClick={() => setExtraPayDebt(debt)} className="icon-btn" aria-label="Payer" title="Payer">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                        </button>
                        <button onClick={() => setChargeDebt(debt)} className="icon-btn" aria-label="Nouvelle charge" title="Nouvelle charge">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
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
                  </div>

                  {/* Debt details row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '14px',
                    paddingTop: '14px',
                    borderTop: '1px solid var(--slate-100)',
                    gap: '8px',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'var(--slate-500)',
                      letterSpacing: '-0.01em',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--slate-400)', flexShrink: 0 }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      Mensualité{' '}
                      <strong style={{ fontWeight: 700, color: 'var(--slate-700)' }}>
                        {formatCAD(Number(debt.payment_amount))}{FREQ_LABELS[debt.payment_frequency] ?? ''}
                      </strong>
                    </div>
                    {debt.auto_debit && (
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-400)', letterSpacing: '-0.01em' }}>
                        Prélèvement auto
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FAB EXPANDABLE (mobile only, hidden on >= 1024px) ── */}
      {/* Backdrop */}
      {fabOpen && (
        <div
          className="fab-mobile-only"
          onClick={() => setFabOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.3)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            zIndex: 39,
          }}
        />
      )}

      <div className="fab-mobile-only" style={{
        position: 'fixed',
        bottom: 'max(72px, calc(56px + env(safe-area-inset-bottom)))',
        right: '20px',
        zIndex: 40,
      }}>
        {/* FAB menu */}
        <div style={{
          position: 'absolute',
          bottom: '64px',
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          opacity: fabOpen ? 1 : 0,
          pointerEvents: fabOpen ? 'auto' : 'none',
          transform: fabOpen ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.95)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {/* Nouveau projet */}
          <button
            onClick={() => { setFabOpen(false); setCreateModal(true); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              background: 'var(--white, #fff)',
              border: '1px solid var(--slate-200)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--slate-900)',
              letterSpacing: '-0.01em',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--teal-50)',
              color: 'var(--teal-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </span>
            Nouveau projet
          </button>

          {/* Nouvelle dette */}
          <button
            onClick={() => { setFabOpen(false); setEditDebt(null); setDebtModal(true); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 16px',
              background: 'var(--white, #fff)',
              border: '1px solid var(--slate-200)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--slate-900)',
              letterSpacing: '-0.01em',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--error-light)',
              color: 'var(--error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </span>
            Nouvelle dette
          </button>
        </div>

        {/* FAB main button */}
        <button
          onClick={() => setFabOpen(!fabOpen)}
          className="fab"
          aria-label="Ajouter"
          style={{ position: 'relative', bottom: 0, right: 0, background: fabOpen ? 'var(--teal-800)' : 'var(--teal-700)' }}
        >
          <svg
            width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{
              transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* ── MODALS ── */}

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

      {/* Pay debt modal */}
      {extraPayDebt && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setExtraPayDebt(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            {/* Sheet header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--error-light)', color: 'var(--error)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.02em' }}>
                  Payer une dette
                </h3>
              </div>
              <button
                onClick={() => setExtraPayDebt(null)}
                style={{
                  width: '36px', height: '36px', border: 'none',
                  background: 'var(--slate-100)', borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--slate-500)', flexShrink: 0,
                }}
                aria-label="Fermer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Sheet body */}
            <div style={{ padding: '20px 24px 24px' }}>
              {/* Debt info */}
              <div style={{ marginBottom: '18px', padding: '14px', background: 'var(--teal-50)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(15, 118, 110, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--slate-500)' }}>{extraPayDebt.name}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--error)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                    {formatCAD(Number(extraPayDebt.remaining_balance))}
                  </span>
                </div>
              </div>

              {/* Payment type */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{
                  display: 'block', fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--slate-400)', marginBottom: '7px',
                }}>
                  Type de paiement
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {(['regular', 'extra'] as const).map((type) => (
                    <label key={type} style={{ flex: 1, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="payment-type"
                        checked={extraPayType === type}
                        onChange={() => {
                          setExtraPayType(type);
                          if (type === 'regular') {
                            setExtraPayAmount(String(extraPayDebt?.payment_amount ?? ''));
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                        padding: '14px 12px',
                        border: extraPayType === type ? '1.5px solid var(--teal-700)' : '1.5px solid var(--slate-200)',
                        borderRadius: 'var(--radius-md)',
                        background: extraPayType === type ? 'var(--teal-50)' : 'transparent',
                        boxShadow: extraPayType === type ? '0 0 0 3px rgba(15, 118, 110, 0.06)' : 'none',
                        transition: 'all 0.2s ease',
                        textAlign: 'center',
                      }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: extraPayType === type ? 'var(--teal-700)' : 'var(--slate-900)', letterSpacing: '-0.01em' }}>
                          {type === 'regular' ? 'Régulier' : 'Supplémentaire'}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--slate-500)', lineHeight: 1.3 }}>
                          {type === 'regular' ? 'Mensualité prévue' : 'Paiement en plus'}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{
                  display: 'block', fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--slate-400)', marginBottom: '7px',
                }}>
                  Montant
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number" min="0.01" step="0.01" placeholder="0"
                    value={extraPayAmount}
                    onChange={(e) => setExtraPayAmount(e.target.value)}
                    style={{
                      width: '100%', padding: '14px', paddingRight: '36px',
                      border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font)', fontSize: '24px', fontWeight: 800,
                      letterSpacing: '-0.03em', color: 'var(--slate-900)',
                      background: 'var(--white, #fff)', fontVariantNumeric: 'tabular-nums',
                      outline: 'none',
                    }}
                  />
                  <span style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '16px', fontWeight: 700, color: 'var(--teal-700)', pointerEvents: 'none',
                  }}>$</span>
                </div>
                <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--slate-400)', marginTop: '6px', letterSpacing: '-0.01em' }}>
                  Mensualité prévue : <strong style={{ fontWeight: 700, color: 'var(--slate-700)' }}>
                    {formatCAD(Number(extraPayDebt.payment_amount))}{FREQ_LABELS[extraPayDebt.payment_frequency] ?? ''}
                  </strong>
                </p>
              </div>

              {/* Summary */}
              {extraPayAmount && parseFloat(extraPayAmount) > 0 && (
                <div style={{ marginBottom: '0', padding: '14px', background: 'var(--teal-50)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(15, 118, 110, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--slate-500)' }}>Solde après paiement</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCAD(Math.max(0, Number(extraPayDebt.remaining_balance) - parseFloat(extraPayAmount)))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Sheet actions */}
            <div style={{ display: 'flex', gap: '10px', padding: '0 24px 24px' }}>
              <button
                onClick={() => { setExtraPayDebt(null); setExtraPayAmount(''); setExtraPayType('regular'); }}
                style={{
                  flex: 1, padding: '14px 20px', border: '1px solid var(--slate-200)',
                  borderRadius: 'var(--radius-md)', background: 'var(--white, #fff)',
                  fontFamily: 'var(--font)', fontSize: '15px', fontWeight: 600,
                  color: 'var(--slate-700)', cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleExtraPayment}
                disabled={!extraPayAmount || parseFloat(extraPayAmount) <= 0}
                style={{
                  flex: 1.4, padding: '14px 20px', border: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--error)',
                  fontFamily: 'var(--font)', fontSize: '15px', fontWeight: 700,
                  color: 'var(--white, #fff)', cursor: 'pointer',
                  opacity: !extraPayAmount || parseFloat(extraPayAmount) <= 0 ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                Payer {extraPayAmount ? formatCAD(parseFloat(extraPayAmount)) : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New charge modal */}
      {chargeDebt && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setChargeDebt(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--error-light)', color: 'var(--error)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.02em' }}>
                  Nouvelle charge
                </h3>
              </div>
              <button
                onClick={() => setChargeDebt(null)}
                style={{
                  width: '36px', height: '36px', border: 'none',
                  background: 'var(--slate-100)', borderRadius: 'var(--radius-sm)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--slate-500)', flexShrink: 0,
                }}
                aria-label="Fermer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '20px 24px 24px' }}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{
                  display: 'block', fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--slate-400)', marginBottom: '7px',
                }}>
                  {chargeDebt.name}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number" min="0.01" step="0.01" placeholder="0"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                    style={{
                      width: '100%', padding: '14px', paddingRight: '36px',
                      border: '1px solid var(--slate-200)', borderRadius: 'var(--radius-sm)',
                      fontFamily: 'var(--font)', fontSize: '24px', fontWeight: 800,
                      letterSpacing: '-0.03em', color: 'var(--slate-900)',
                      background: 'var(--white, #fff)', fontVariantNumeric: 'tabular-nums',
                      outline: 'none',
                    }}
                  />
                  <span style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    fontSize: '16px', fontWeight: 700, color: 'var(--teal-700)', pointerEvents: 'none',
                  }}>$</span>
                </div>
              </div>
              <div style={{ marginBottom: '18px' }}>
                <label style={{
                  display: 'block', fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--slate-400)', marginBottom: '7px',
                }}>
                  Note (optionnel)
                </label>
                <input
                  type="text" placeholder="Ex: Achat Amazon"
                  value={chargeNote}
                  onChange={(e) => setChargeNote(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', padding: '0 24px 24px' }}>
              <button
                onClick={() => { setChargeDebt(null); setChargeAmount(''); setChargeNote(''); }}
                style={{
                  flex: 1, padding: '14px 20px', border: '1px solid var(--slate-200)',
                  borderRadius: 'var(--radius-md)', background: 'var(--white, #fff)',
                  fontFamily: 'var(--font)', fontSize: '15px', fontWeight: 600,
                  color: 'var(--slate-700)', cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleCharge}
                disabled={!chargeAmount || parseFloat(chargeAmount) <= 0}
                style={{
                  flex: 1.4, padding: '14px 20px', border: 'none',
                  borderRadius: 'var(--radius-md)', background: 'var(--error)',
                  fontFamily: 'var(--font)', fontSize: '15px', fontWeight: 700,
                  color: 'var(--white, #fff)', cursor: 'pointer',
                  opacity: !chargeAmount || parseFloat(chargeAmount) <= 0 ? 0.5 : 1,
                }}
              >
                Ajouter la charge
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
