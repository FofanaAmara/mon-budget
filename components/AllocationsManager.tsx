'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import SheetCloseButton from '@/components/SheetCloseButton';
import { deleteAllocation, reorderAllocations } from '@/lib/actions/allocations';
import { formatCAD } from '@/lib/utils';
import type { IncomeAllocation, Section, Expense } from '@/lib/types';
import AllocationModal from './AllocationModal';

type Props = {
  allocations: IncomeAllocation[];
  sections: Section[];
  projects: Expense[];
  expectedMonthlyIncome: number;
};

export default function AllocationsManager({ allocations, sections, projects, expectedMonthlyIncome }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [editAllocation, setEditAllocation] = useState<IncomeAllocation | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<IncomeAllocation | null>(null);

  const totalAllocated = allocations.reduce((s, a) => s + Number(a.amount), 0);
  const disponible = expectedMonthlyIncome - totalAllocated;
  const isOverAllocated = disponible < 0;

  function openAdd() {
    setEditAllocation(undefined);
    setShowModal(true);
  }

  function openEdit(a: IncomeAllocation) {
    setEditAllocation(a);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditAllocation(undefined);
    router.refresh();
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      await deleteAllocation(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const ids = allocations.map(a => a.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    startTransition(async () => {
      await reorderAllocations(ids);
      router.refresh();
    });
  }

  function moveDown(index: number) {
    if (index === allocations.length - 1) return;
    const ids = allocations.map(a => a.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    startTransition(async () => {
      await reorderAllocations(ids);
      router.refresh();
    });
  }

  return (
    <>
      {/* Hero summary card */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <div className="flex" style={{ gap: '0', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: '4px' }}>
              Revenu mensuel
            </p>
            <p className="amount" style={{ fontSize: 'var(--text-lg)', fontWeight: 750 }}>
              {formatCAD(expectedMonthlyIncome)}
            </p>
          </div>
          <div style={{ width: '1px', background: 'var(--border)', margin: '0 12px' }} />
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
              Disponible
            </p>
            <p className="amount" style={{
              fontSize: 'var(--text-lg)', fontWeight: 750,
              color: isOverAllocated ? 'var(--warning-text)' : 'var(--positive)',
            }}>
              {formatCAD(disponible)}
            </p>
          </div>
        </div>
        {isOverAllocated && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--warning-subtle)',
            fontSize: 'var(--text-xs)',
            color: 'var(--warning-text)',
            fontWeight: 600,
          }}>
            ⚠ Surallocation de {formatCAD(Math.abs(disponible))} — le total alloué dépasse le revenu mensuel
          </div>
        )}
      </div>

      {/* Allocations list — grouped by type */}
      {allocations.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center" style={{ padding: '60px 0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.5 }}>🗂️</div>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: '6px' }}>
            Aucune enveloppe définie
          </p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', opacity: 0.7 }}>
            Créez votre première enveloppe pour commencer à allouer votre revenu
          </p>
        </div>
      ) : (
        <>
          {([
            { key: 'charges', label: '📦 Charges', filter: (a: IncomeAllocation) => a.section_ids.length > 0 },
            { key: 'savings', label: '💰 Épargne', filter: (a: IncomeAllocation) => a.section_ids.length === 0 && !!a.project_id },
            { key: 'free', label: '🔖 Autre', filter: (a: IncomeAllocation) => a.section_ids.length === 0 && !a.project_id },
          ] as { key: string; label: string; filter: (a: IncomeAllocation) => boolean }[]).map(group => {
            const groupItems = allocations.filter(group.filter);
            if (groupItems.length === 0) return null;
            return (
              <div key={group.key} style={{ marginBottom: '20px' }}>
                <h2 className="section-label" style={{ marginBottom: '12px', paddingLeft: '4px' }}>
                  {group.label} ({groupItems.length})
                </h2>
                <div className="card" style={{ overflow: 'hidden' }}>
                  {groupItems.map((alloc, i) => {
            const isGoalReached = alloc.project_id
              && alloc.project_target_amount !== null
              && alloc.project_target_amount !== undefined
              && Number(alloc.project_saved_amount ?? 0) >= Number(alloc.project_target_amount);

            const hasSectionLink = alloc.section_ids.length > 0;
            const hasProjectLink = !!alloc.project_id;

            const globalIndex = allocations.findIndex(a => a.id === alloc.id);
            return (
              <div
                key={alloc.id}
                style={{
                  padding: '14px 20px',
                  borderBottom: i < groupItems.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div className="flex items-center" style={{ gap: '12px' }}>
                  {/* Color dot */}
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: alloc.color,
                    flexShrink: 0,
                  }} />

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center" style={{ gap: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                        {alloc.label}
                      </span>
                      {isGoalReached && (
                        <span className="badge" style={{ background: 'var(--positive-subtle)', color: 'var(--positive)', fontSize: '10px' }}>
                          ✓ Objectif atteint
                        </span>
                      )}
                    </div>
                    <div className="flex items-center" style={{ gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                        {formatCAD(Number(alloc.amount))}/mois
                      </span>
                      {hasSectionLink && alloc.sections.map(sec => (
                        <span
                          key={sec.id}
                          className="badge"
                          title={sec.name}
                          style={{
                            background: 'var(--surface-secondary)',
                            color: 'var(--text-secondary)',
                            fontSize: alloc.sections.length >= 3 ? '11px' : undefined,
                            padding: alloc.sections.length >= 3 ? '2px 6px' : undefined,
                          }}
                        >
                          {sec.icon}{alloc.sections.length < 3 ? ` ${sec.name}` : ''}
                        </span>
                      ))}
                      {hasProjectLink && !hasSectionLink && (
                        <span className="badge" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                          💰 {alloc.project_name}
                        </span>
                      )}
                      {!hasSectionLink && !hasProjectLink && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', opacity: 0.6 }}>
                          Sans suivi
                        </span>
                      )}
                      {alloc.end_month && !isGoalReached && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', opacity: 0.7 }}>
                          · Jusqu'à {alloc.end_month}
                        </span>
                      )}
                    </div>
                    {/* Project progress */}
                    {hasProjectLink && alloc.project_target_amount && !isGoalReached && (
                      <div style={{ marginTop: '6px' }}>
                        <div style={{
                          height: '3px',
                          borderRadius: '2px',
                          background: 'var(--border)',
                          overflow: 'hidden',
                          width: '120px',
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min((Number(alloc.project_saved_amount ?? 0) / Number(alloc.project_target_amount)) * 100, 100)}%`,
                            background: alloc.color,
                            borderRadius: '2px',
                          }} />
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px', display: 'block' }}>
                          {formatCAD(Number(alloc.project_saved_amount ?? 0))} / {formatCAD(Number(alloc.project_target_amount))}
                          {' '}· {((Number(alloc.project_saved_amount ?? 0) / Number(alloc.project_target_amount)) * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center" style={{ gap: '4px', flexShrink: 0 }}>
                    <button
                      onClick={() => moveUp(globalIndex)}
                      disabled={globalIndex === 0}
                      style={{
                        padding: '4px',
                        color: globalIndex === 0 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                        opacity: globalIndex === 0 ? 0.3 : 1,
                        background: 'none',
                        border: 'none',
                        cursor: globalIndex === 0 ? 'default' : 'pointer',
                        borderRadius: 'var(--radius-sm)',
                      }}
                      aria-label="Monter"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 15l-6-6-6 6" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveDown(globalIndex)}
                      disabled={globalIndex === allocations.length - 1}
                      style={{
                        padding: '4px',
                        color: globalIndex === allocations.length - 1 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                        opacity: globalIndex === allocations.length - 1 ? 0.3 : 1,
                        background: 'none',
                        border: 'none',
                        cursor: globalIndex === allocations.length - 1 ? 'default' : 'pointer',
                        borderRadius: 'var(--radius-sm)',
                      }}
                      aria-label="Descendre"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    <button
                      onClick={() => openEdit(alloc)}
                      style={{
                        padding: '6px',
                        color: 'var(--text-secondary)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-sm)',
                      }}
                      aria-label="Modifier"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(alloc)}
                      style={{
                        padding: '6px',
                        color: 'var(--negative)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-sm)',
                      }}
                      aria-label="Supprimer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
                  );
                })}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Add button */}
      <button
        onClick={openAdd}
        className="btn-secondary"
        style={{ width: '100%', padding: '14px', fontSize: 'var(--text-sm)' }}
      >
        + Ajouter une enveloppe
      </button>

      {/* Create / Edit modal */}
      {showModal && (
        <AllocationModal
          allocation={editAllocation}
          sections={sections}
          projects={projects}
          expectedMonthlyIncome={expectedMonthlyIncome}
          currentTotalAllocated={totalAllocated}
          onClose={closeModal}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <SheetCloseButton onClose={() => setDeleteTarget(null)} />
            <div style={{ padding: '8px 24px 32px' }}>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Supprimer cette enveloppe ?
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginBottom: '24px' }}>
                "{deleteTarget.label}" sera retirée de toutes les allocations futures. Cette action est irréversible.
              </p>
              <div className="flex" style={{ gap: '12px' }}>
                <button
                  onClick={() => setDeleteTarget(null)}
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
    </>
  );
}
