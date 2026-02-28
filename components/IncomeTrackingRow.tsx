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
    <div>
      {index > 0 && <div className="divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
      <div style={{ padding: '12px 20px' }}>
        <div className="flex items-center" style={{ gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: srcMeta.bg, flexShrink: 0, fontSize: '14px',
          }}>
            {srcMeta.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {mi.income_name ?? '—'}
            </p>
            <div className="flex items-center" style={{ gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '999px', background: statusBg, color: statusColor }}>
                {statusLabel}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                {mi.is_auto_deposited ? '· Auto' : ''}
                {isReceived && mi.received_at ? ` · ${formatShortDate(mi.received_at)}` : ''}
              </span>
            </div>
            {mi.income_frequency === 'BIWEEKLY' && mi.income_pay_anchor_date && (
              <p style={{ fontSize: '11px', color: 'var(--accent)', marginTop: '2px', fontWeight: 600 }}>
                Prochaine : {formatShortDate(getNextBiweeklyPayDate(mi.income_pay_anchor_date))}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {isReceived && mi.actual_amount !== null ? (
              <span className="amount" style={{ fontSize: 'var(--text-sm)', color: 'var(--positive)' }}>
                {formatCAD(Number(mi.actual_amount))}
              </span>
            ) : (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                ~{formatCAD(Number(mi.expected_amount ?? 0))}
              </span>
            )}
          </div>

          {isCurrentMonth && (
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                padding: '8px', color: 'var(--text-tertiary)',
                borderRadius: 'var(--radius-sm)',
                transition: `color var(--duration-fast) var(--ease-out)`,
                flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
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
    <div>
      {index > 0 && <div className="divider" style={{ marginLeft: '20px', marginRight: '20px' }} />}
      <div style={{ padding: '12px 20px' }}>
        <div className="flex items-center" style={{ gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: srcMeta.bg, flexShrink: 0, fontSize: '14px',
          }}>
            {srcMeta.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {inc.name}
            </p>
            <div className="flex items-center" style={{ gap: '6px', marginTop: '3px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '999px', background: 'var(--surface-sunken)', color: 'var(--text-tertiary)' }}>
                Variable
              </span>
            </div>
          </div>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
            {inc.estimated_amount ? `~${formatCAD(Number(inc.estimated_amount))}` : '—'}
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
  );
}
