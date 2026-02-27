'use client';

import { formatCAD } from '@/lib/utils';
import { SOURCE_META } from '@/lib/constants';
import type { MonthlyIncome, Income, IncomeSource } from '@/lib/types';

// ─── Fixed income instance row (from monthly_incomes) ───────────────────────

type IncomeInstanceProps = {
  mi: MonthlyIncome;
  index: number;
  isCurrentMonth: boolean;
  onMarkReceived: () => void;
};

export function IncomeInstanceRow({ mi, index, isCurrentMonth, onMarkReceived }: IncomeInstanceProps) {
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
      <div className="flex items-center" style={{ gap: '12px', padding: '12px 20px' }}>
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
          <div className="flex items-center" style={{ gap: '6px', marginTop: '3px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 5px', borderRadius: '999px', background: statusBg, color: statusColor }}>
              {statusLabel}
            </span>
          </div>
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
        {isCurrentMonth && !isReceived && (
          <button
            onClick={onMarkReceived}
            style={{
              flexShrink: 0, padding: '6px 10px',
              fontSize: '11px', fontWeight: 650,
              color: 'var(--positive-text)',
              background: 'var(--positive-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Reçu ✓
          </button>
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
      <div className="flex items-center" style={{ gap: '12px', padding: '12px 20px' }}>
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
  );
}
