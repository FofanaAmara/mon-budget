'use client';

import { useState } from 'react';
import { formatCAD, formatShortDate, getNextBiweeklyPayDate } from '@/lib/utils';
import { SOURCE_META } from '@/lib/constants';
import type { MonthlyIncome, Income, IncomeSource } from '@/lib/types';

// ─── Fixed income instance row (from monthly_incomes) ───────────────────────

type IncomeInstanceProps = {
  mi: MonthlyIncome;
  index: number;
  isCurrentMonth: boolean;
  onMarkReceived: () => void;
  onMarkExpected: () => void;
  onDelete?: () => void;
  onUpdateAmount?: () => void;
};

export function IncomeInstanceRow({ mi, index, isCurrentMonth, onMarkReceived, onMarkExpected, onDelete, onUpdateAmount }: IncomeInstanceProps) {
  const [expanded, setExpanded] = useState(false);
  const srcMeta = SOURCE_META[(mi.income_source ?? 'OTHER') as IncomeSource];
  const isReceived = mi.status === 'RECEIVED' || mi.status === 'PARTIAL';

  const statusBg = mi.status === 'RECEIVED' ? 'var(--positive-subtle)'
    : mi.status === 'PARTIAL' ? 'var(--warning-subtle)'
    : mi.status === 'MISSED' ? 'var(--negative-subtle)'
    : 'var(--surface-sunken)';
  const statusColor = mi.status === 'RECEIVED' ? 'var(--positive-text)'
    : mi.status === 'PARTIAL' ? 'var(--warning-text)'
    : mi.status === 'MISSED' ? 'var(--negative-text)'
    : 'var(--text-tertiary)';
  const statusLabel = mi.status === 'RECEIVED' ? 'Reçu'
    : mi.status === 'PARTIAL' ? 'Partiel'
    : mi.status === 'MISSED' ? 'Manqué'
    : 'Attendu';

  return (
    <div style={{
      borderBottom: '1px solid var(--slate-100, #F1F5F9)',
    }}>
      <div style={{ padding: '12px 16px 12px 18px' }}>
        <div className="flex items-center" style={{ gap: '12px' }}>
          {/* Category icon — 38px aligned with ExpenseTrackingRow */}
          <div style={{
            width: '38px', height: '38px', borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: srcMeta.bg, flexShrink: 0, fontSize: '18px', lineHeight: '1',
          }}>
            {srcMeta.icon}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--slate-900)',
                letterSpacing: '-0.01em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {mi.income_name ?? '—'}
              </span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px',
              fontSize: '11px', fontWeight: 600, color: 'var(--slate-400)',
              letterSpacing: '0.02em',
            }}>
              <span style={{
                padding: '1px 6px', borderRadius: '999px',
                background: statusBg, color: statusColor,
                fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.02em',
              }}>
                {statusLabel}
              </span>
              {mi.is_auto_deposited && (
                <>
                  <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--slate-300)', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Auto</span>
                </>
              )}
              {isReceived && mi.received_at && (
                <>
                  <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--slate-300)', display: 'inline-block', flexShrink: 0 }} />
                  <span>{formatShortDate(mi.received_at)}</span>
                </>
              )}
              {mi.income_frequency === 'BIWEEKLY' && mi.income_pay_anchor_date && (
                <>
                  <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--slate-300)', display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ color: 'var(--accent)' }} suppressHydrationWarning>
                    Prochaine : {formatShortDate(getNextBiweeklyPayDate(mi.income_pay_anchor_date))}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Amount */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {isReceived && mi.actual_amount !== null ? (
              <span style={{
                fontSize: '15px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--positive)',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}>
                <span style={{ fontSize: '0.7em', fontWeight: 600, color: 'var(--teal-700)' }}>$</span>
                {Number(mi.actual_amount).toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            ) : (
              <span style={{
                fontSize: '15px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--slate-400)',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}>
                <span style={{ fontSize: '0.7em', fontWeight: 500, color: 'var(--slate-300)' }}>~$</span>
                {Number(mi.expected_amount ?? 0).toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            )}

            {/* Three-dot menu — only when actions exist */}
            {isCurrentMonth && (!isReceived || (!mi.is_auto_deposited && isReceived) || (!!onDelete && Number(mi.expected_amount ?? 0) === 0)) && (
              <button
                onClick={() => setExpanded((v) => !v)}
                style={{
                  width: '28px', height: '28px',
                  padding: '0', color: 'var(--text-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  transition: `color var(--duration-fast) var(--ease-out)`,
                  flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                aria-label="Actions"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="5" r="1" fill="currentColor" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" />
                  <circle cx="12" cy="19" r="1" fill="currentColor" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {expanded && isCurrentMonth && (
          <div className="flex" style={{ gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            {!isReceived && (
              <button onClick={() => { onMarkReceived(); setExpanded(false); }} className="btn-action btn-action-positive">
                Marquer reçu
              </button>
            )}
            {!isReceived && !mi.is_auto_deposited && onUpdateAmount && (
              <button onClick={() => { onUpdateAmount(); setExpanded(false); }} className="btn-action btn-action-neutral">
                Modifier montant
              </button>
            )}
            {isReceived && !mi.is_auto_deposited && (
              <button onClick={() => { onMarkExpected(); setExpanded(false); }} className="btn-action btn-action-accent">
                Marquer non reçu
              </button>
            )}
            {onDelete && Number(mi.expected_amount ?? 0) === 0 && (
              <button onClick={() => { onDelete(); setExpanded(false); }} className="btn-action btn-action-danger">
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Variable income row (not yet registered this month) ────────────────────

type VariableIncomeProps = {
  inc: Income;
  index: number;
  isCurrentMonth: boolean;
  onMarkReceived: () => void;
};

export function VariableIncomeRow({ inc, index, isCurrentMonth, onMarkReceived }: VariableIncomeProps) {
  const srcMeta = SOURCE_META[(inc.source ?? 'OTHER') as IncomeSource];

  return (
    <div style={{
      borderBottom: '1px solid var(--slate-100, #F1F5F9)',
    }}>
      <div style={{ padding: '12px 16px 12px 18px' }}>
        <div className="flex items-center" style={{ gap: '12px' }}>
          {/* Category icon — 38px aligned with ExpenseTrackingRow */}
          <div style={{
            width: '38px', height: '38px', borderRadius: 'var(--radius-sm)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: srcMeta.bg, flexShrink: 0, fontSize: '18px', lineHeight: '1',
          }}>
            {srcMeta.icon}
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--slate-900)',
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
            }}>
              {inc.name}
            </span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px',
              fontSize: '11px', fontWeight: 600, color: 'var(--slate-400)',
              letterSpacing: '0.02em',
            }}>
              <span style={{
                padding: '1px 6px', borderRadius: '999px',
                background: 'var(--surface-sunken)', color: 'var(--text-tertiary)',
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.02em',
              }}>
                Variable
              </span>
            </div>
          </div>

          {/* Amount + action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span style={{
              fontSize: '15px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--slate-400)',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}>
              {inc.estimated_amount ? (
                <>
                  <span style={{ fontSize: '0.7em', fontWeight: 500, color: 'var(--slate-300)' }}>~$</span>
                  {Number(inc.estimated_amount).toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </>
              ) : '—'}
            </span>
            {isCurrentMonth && (
              <button
                onClick={onMarkReceived}
                style={{
                  flexShrink: 0, padding: '6px 10px',
                  fontSize: '11px', fontWeight: 650,
                  color: 'var(--accent)',
                  background: 'var(--accent-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Saisir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
