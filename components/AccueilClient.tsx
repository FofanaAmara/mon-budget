'use client';

import { useState, useEffect } from 'react';
import MonthNavigator from '@/components/MonthNavigator';
import Onboarding from '@/components/Onboarding';
import TabTableauDeBord from '@/components/accueil/TabTableauDeBord';
import TabTimeline from '@/components/accueil/TabTimeline';
import TabSanteFinanciere from '@/components/accueil/TabSanteFinanciere';
import Link from 'next/link';
import { formatCAD } from '@/lib/utils';
import type { MonthSummary, MonthlyExpense, MonthlyIncome, Expense, MonthlySavingsSummary, MonthlyDebtSummary } from '@/lib/types';

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
  savingsSummary: MonthlySavingsSummary;
  debtSummary: MonthlyDebtSummary;
  isNewUser?: boolean;
};

export default function AccueilClient({
  summary, incomeSummary, expenses, monthlyIncomes, month,
  monthlyIncomeFromTemplates, totalMonthlyExpenses, projets, totalDebtBalance,
  savingsSummary, debtSummary, isNewUser,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isNewUser && !localStorage.getItem('mes-finances-onboarding-done')) {
      setShowOnboarding(true);
    }
  }, [isNewUser]);

  const totalEpargne = projets.reduce((s, p) => s + Number(p.saved_amount ?? 0), 0);
  const valeurNette = totalEpargne - totalDebtBalance;
  const availableAmount = incomeSummary.actualTotal - summary.paid_total;

  return (
    <div style={{ padding: '0 0 96px', minHeight: '100vh' }}>
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      {/* Patrimoine — above month nav, snapshot at instant T */}
      <div style={{ padding: '20px 20px 0' }}>
        <Link href="/projets" className="block card card-press" style={{
          marginBottom: '20px',
          padding: '16px 20px',
          borderLeft: `3px solid ${valeurNette >= 0 ? 'var(--accent)' : 'var(--negative)'}`,
        }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Patrimoine
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.4 }}><path d="M9 18l6-6-6-6" /></svg>
          </div>
          <p className="amount" style={{ fontSize: 'var(--text-xl)', fontWeight: 750, color: valeurNette >= 0 ? 'var(--accent)' : 'var(--negative)' }}>
            {valeurNette >= 0 ? '+' : ''}{formatCAD(valeurNette)}
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Actifs: {formatCAD(totalEpargne)} | Passifs: {formatCAD(totalDebtBalance)}
          </p>
        </Link>

        <MonthNavigator month={month} basePath="/" />
      </div>

      {/* Monument: solde disponible */}
      <div style={{
        padding: '24px 20px 20px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-tertiary)', marginBottom: '4px' }}>
          Bonjour 👋
        </p>
        <p style={{
          fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '16px',
        }}>
          {new Date(month + '-01').toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}
        </p>
        <p style={{
          fontSize: 'clamp(3.5rem, 15vw, 6rem)',
          fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1,
          color: 'var(--text-primary)',
        }}>
          <span style={{ fontSize: '0.4em', fontWeight: 600, color: 'var(--accent)', verticalAlign: 'super' }}>$</span>
          {Math.abs(availableAmount).toLocaleString('fr-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-tertiary)', marginTop: '8px', letterSpacing: '0.02em' }}>
          {availableAmount >= 0 ? 'disponibles ce mois-ci' : 'de dépassement ce mois-ci'}
        </p>
        {/* Status badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px',
            background: availableAmount >= 0 ? 'var(--positive-subtle)' : 'var(--negative-subtle)',
            borderRadius: '100px',
            fontSize: '13px', fontWeight: 600,
            color: availableAmount >= 0 ? 'var(--positive-text)' : 'var(--negative-text)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {availableAmount >= 0
                ? <><path d="M20 6L9 17l-5-5"/></>
                : <><path d="M18 6L6 18M6 6l12 12"/></>
              }
            </svg>
            {availableAmount >= 0 ? 'Dans les temps' : 'Budget dépassé'}
          </span>
        </div>
      </div>

      {/* Tab strip + content */}
      <div style={{ padding: '0 20px' }}>
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
            savingsSummary={savingsSummary}
            debtSummary={debtSummary}
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
    </div>
  );
}
