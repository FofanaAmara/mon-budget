/**
 * Shared constants for monthly tracking UI.
 * Extracted from MonMoisClient.tsx — reused in DepensesTrackingClient, RevenusTrackingClient.
 */

import type { MonthlyExpenseStatus, IncomeSource } from '@/lib/types';

export const STATUS_LABELS: Record<MonthlyExpenseStatus, string> = {
  UPCOMING: 'A venir',
  PAID: 'Paye',
  OVERDUE: 'En retard',
  DEFERRED: 'Reporte',
};

export const STATUS_STYLES: Record<MonthlyExpenseStatus, { bg: string; color: string }> = {
  UPCOMING: { bg: 'var(--accent-subtle)', color: 'var(--accent)' },
  PAID: { bg: 'var(--positive-subtle)', color: 'var(--positive-text)' },
  OVERDUE: { bg: 'var(--negative-subtle)', color: 'var(--negative-text)' },
  DEFERRED: { bg: 'var(--surface-sunken)', color: 'var(--text-tertiary)' },
};

export const GROUP_ORDER: MonthlyExpenseStatus[] = ['OVERDUE', 'UPCOMING', 'DEFERRED', 'PAID'];

export const GROUP_LABELS: Record<MonthlyExpenseStatus, string> = {
  OVERDUE: 'En retard',
  UPCOMING: 'A venir',
  DEFERRED: 'Reporte',
  PAID: 'Paye',
};

export const SOURCE_META: Record<IncomeSource, { label: string; icon: string; color: string; bg: string }> = {
  EMPLOYMENT: { label: 'Emploi',         icon: '💼', color: '#3D3BF3', bg: '#EDEDFE' },
  BUSINESS:   { label: 'Business',       icon: '🏢', color: '#7C3AED', bg: '#F5F3FF' },
  INVESTMENT: { label: 'Investissement', icon: '📈', color: '#1A7F5A', bg: '#E8F5EE' },
  OTHER:      { label: 'Autre',          icon: '🔧', color: '#6B6966', bg: '#F5F4F1' },
};
