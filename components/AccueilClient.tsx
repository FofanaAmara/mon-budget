'use client';

import { useState } from 'react';
import MonthNavigator from '@/components/MonthNavigator';
import TabTableauDeBord from '@/components/accueil/TabTableauDeBord';
import TabTimeline from '@/components/accueil/TabTimeline';
import TabSanteFinanciere from '@/components/accueil/TabSanteFinanciere';
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

  return (
    <div style={{ padding: '36px 20px 96px', minHeight: '100vh' }}>
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
          projets={projets}
          totalDebtBalance={totalDebtBalance}
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
