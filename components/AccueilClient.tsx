'use client';

import { useState } from 'react';
import MonthNavigator from '@/components/MonthNavigator';
import TabTableauDeBord from '@/components/accueil/TabTableauDeBord';
import TabTimeline from '@/components/accueil/TabTimeline';
import TabSanteFinanciere from '@/components/accueil/TabSanteFinanciere';
import Link from 'next/link';
import { formatCAD } from '@/lib/utils';
import type { MonthSummary, MonthlyExpense, MonthlyIncome, Expense } from '@/lib/types';

type Tab = 'dashboard' | 'timeline' | 'sante';

const TABS: { key: Tab; label: string }[] = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'sante', label: 'Santé' },
];

type Props = {
  summary: MonthSummary;
  incomeSummary: { expectedTotal: number; actualTotal: number };
  expenses: MonthlyExpense[];
  monthlyIncomes: MonthlyIncome[];
  month: string;
  monthlyIncomeFromTemplates: number;
  totalMonthlyExpenses: number;
  projets: Expense[];
  totalDebtBalance: number;
};

export default function AccueilClient({
  summary, incomeSummary, expenses, monthlyIncomes, month,
  monthlyIncomeFromTemplates, totalMonthlyExpenses, projets, totalDebtBalance,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const totalEpargne = projets.reduce((s, p) => s + Number(p.saved_amount ?? 0), 0);
  const valeurNette = totalEpargne - totalDebtBalance;

  return (
    <div style={{ padding: '36px 20px 96px', minHeight: '100vh' }}>
      {/* Patrimoine — above month nav, snapshot at instant T */}
      <Link href="/projets" className="block card card-press" style={{
        marginBottom: '20px',
        padding: '16px 20px',
        background: valeurNette >= 0
          ? 'linear-gradient(135deg, #059669, #047857)'
          : 'linear-gradient(135deg, #DC2626, #B91C1C)',
        color: 'white',
        borderColor: 'transparent',
      }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Patrimoine
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.6 }}><path d="M9 18l6-6-6-6" /></svg>
        </div>
        <p className="amount" style={{ fontSize: 'var(--text-xl)', fontWeight: 750 }}>
          {valeurNette >= 0 ? '+' : ''}{formatCAD(valeurNette)}
        </p>
        <p style={{ fontSize: 'var(--text-xs)', opacity: 0.7, marginTop: '4px' }}>
          Actifs: {formatCAD(totalEpargne)} | Passifs: {formatCAD(totalDebtBalance)}
        </p>
      </Link>

      <MonthNavigator month={month} basePath="/" />

      {/* Tab strip */}
      <div className="flex scrollbar-hide" style={{
        gap: '6px', marginBottom: '20px',
        background: 'var(--surface-inset)',
        borderRadius: 'var(--radius-md)',
        padding: '4px',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-xs)', fontWeight: 650,
              cursor: 'pointer',
              background: activeTab === tab.key ? 'var(--surface-raised)' : 'transparent',
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: 'none',
              boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'dashboard' && (
        <TabTableauDeBord
          summary={summary}
          incomeSummary={incomeSummary}
          totalMonthlyExpenses={totalMonthlyExpenses}
        />
      )}

      {activeTab === 'timeline' && (
        <TabTimeline
          expenses={expenses}
          monthlyIncomes={monthlyIncomes}
        />
      )}

      {activeTab === 'sante' && (
        <TabSanteFinanciere
          summary={summary}
          incomeSummary={incomeSummary}
          expenses={expenses}
          monthlyIncomeFromTemplates={monthlyIncomeFromTemplates}
          totalMonthlyExpenses={totalMonthlyExpenses}
        />
      )}
    </div>
  );
}
