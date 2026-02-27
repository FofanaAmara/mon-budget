'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteExpense } from '@/lib/actions/expenses';
import { formatCAD, calcMonthlySuggested, formatDate } from '@/lib/utils';
import ProjectModal from '@/components/ProjectModal';
import AddSavingsModal from '@/components/AddSavingsModal';
import SavingsHistoryModal from '@/components/SavingsHistoryModal';
import TransferSavingsModal from '@/components/TransferSavingsModal';
import type { Expense, Section } from '@/lib/types';

type Props = {
  projets: Expense[];
  sections: Section[];
  freeSavings: Expense;
};

export default function ProjetsEpargneClient({ projets, sections, freeSavings }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [createModal, setCreateModal] = useState(false);
  const [savingsModal, setSavingsModal] = useState<Expense | null>(null);
  const [historyModal, setHistoryModal] = useState<Expense | null>(null);
  const [transferModal, setTransferModal] = useState<Expense | null>(null);

  const allPots = [freeSavings, ...projets];

  const freeSaved = Number(freeSavings.saved_amount ?? 0);
  const projectsSaved = projets.reduce((s, p) => s + Number(p.saved_amount ?? 0), 0);
  const totalEpargne = freeSaved + projectsSaved;

  async function handleDelete(id: string) {
    if (confirm('Supprimer ce projet ?')) {
      startTransition(async () => {
        await deleteExpense(id);
        router.refresh();
      });
    }
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
          Projets & Epargne
        </h1>
      </div>

      {/* Overview — 3 cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        {/* Total épargne */}
        <div className="card" style={{ padding: '16px 20px' }}>
          <div className="flex items-center justify-between">
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-tertiary)' }}>
              Epargne totale
            </p>
            <p className="amount" style={{ fontSize: 'var(--text-lg)', fontWeight: 750, color: 'var(--positive)' }}>
              {formatCAD(totalEpargne)}
            </p>
          </div>
        </div>

        {/* Projets + Libre side by side */}
        <div className="flex" style={{ gap: '8px' }}>
          <div className="card" style={{ flex: 1, padding: '14px 16px' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '4px' }}>
              🎯 Projets
            </p>
            <p className="amount" style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatCAD(projectsSaved)}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {projets.length} projet{projets.length !== 1 ? 's' : ''} actif{projets.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="card" style={{ flex: 1, padding: '14px 16px' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '4px' }}>
              💰 Libre
            </p>
            <p className="amount" style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {formatCAD(freeSaved)}
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Sans objectif
            </p>
          </div>
        </div>
      </div>

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

      {/* FAB — only creates projects now */}
      <button
        onClick={() => setCreateModal(true)}
        className="fab"
        aria-label="Nouveau projet"
        style={{ bottom: 'calc(var(--nav-height) + var(--safe-bottom) + 16px)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Create project modal */}
      {createModal && (
        <ProjectModal
          sections={sections}
          onClose={() => { setCreateModal(false); router.refresh(); }}
        />
      )}

      {/* Add savings modal (shared for projects + épargne libre) */}
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
