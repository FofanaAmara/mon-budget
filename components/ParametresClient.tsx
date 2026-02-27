'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { updateSettings } from '@/lib/actions/settings';
import ExpenseTemplateManager from '@/components/ExpenseTemplateManager';
import IncomeTemplateManager from '@/components/IncomeTemplateManager';
import type { Settings, Expense, Section, Card, Income } from '@/lib/types';

const CURRENCIES = ['CAD', 'USD', 'EUR'];
const REMINDER_OPTIONS = [1, 3, 7, 14, 30];

const NAV_ITEMS = [
  {
    href: '/cartes',
    label: 'Mes cartes de paiement',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    href: '/sections',
    label: 'Mes sections',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

type Props = {
  settings: Settings;
  expenses: Expense[];
  sections: Section[];
  cards: Card[];
  incomes: Income[];
};

export default function ParametresClient({ settings, expenses, sections, cards, incomes }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const [currency, setCurrency] = useState(settings.default_currency);
  const [reminders, setReminders] = useState<number[]>(settings.default_reminder_offsets ?? [1, 3, 7]);
  const [notifyPush, setNotifyPush] = useState(settings.notify_push);
  const [notifyEmail, setNotifyEmail] = useState(settings.notify_email);
  const [email, setEmail] = useState(settings.email ?? '');
  const [phone, setPhone] = useState(settings.phone ?? '');

  function toggleReminder(day: number) {
    setReminders((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  }

  function handleSave() {
    startTransition(async () => {
      await updateSettings(settings.id, {
        email: email.trim() || null,
        phone: phone.trim() || null,
        default_currency: currency,
        default_reminder_offsets: reminders,
        notify_push: notifyPush,
        notify_email: notifyEmail,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div style={{ padding: '36px 20px 24px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 750,
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
        }}>
          Réglages
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Currency */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{
            fontSize: 'var(--text-sm)', fontWeight: 650,
            color: 'var(--text-primary)', marginBottom: '12px',
          }}>Devise par defaut</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className="freq-pill"
                data-active={currency === c}
                style={{ flex: 1, textAlign: 'center' }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Reminders */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{
            fontSize: 'var(--text-sm)', fontWeight: 650,
            color: 'var(--text-primary)', marginBottom: '4px',
          }}>Rappels par defaut</h2>
          <p style={{
            fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
            marginBottom: '12px',
          }}>Jours avant l&apos;echeance</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {REMINDER_OPTIONS.map((day) => (
              <button
                key={day}
                onClick={() => toggleReminder(day)}
                className="freq-pill"
                data-active={reminders.includes(day)}
              >
                {day}j
              </button>
            ))}
          </div>
        </div>

        {/* Contact info */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{
            fontSize: 'var(--text-sm)', fontWeight: 650,
            color: 'var(--text-primary)', marginBottom: '4px',
          }}>Contact</h2>
          <p style={{
            fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
            marginBottom: '16px',
          }}>Pour les notifications email et SMS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="field-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="input-field"
              />
            </div>
            <div>
              <label className="field-label">Telephone (SMS)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 514 000 0000"
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{
            fontSize: 'var(--text-sm)', fontWeight: 650,
            color: 'var(--text-primary)', marginBottom: '16px',
          }}>Canaux de notification</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Notifications push', value: notifyPush, onChange: setNotifyPush },
              { label: 'Email', value: notifyEmail, onChange: setNotifyEmail },
            ].map(({ label, value, onChange }) => (
              <div key={label} className="flex items-center justify-between">
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                  {label}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(!value)}
                  className="toggle"
                  data-active={value}
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Gestion */}
        <div className="list-card">
          <div style={{ padding: '16px 20px 8px' }}>
            <h2 style={{
              fontSize: 'var(--text-sm)', fontWeight: 650,
              color: 'var(--text-primary)',
            }}>Gestion</h2>
          </div>
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="link-row"
              style={{ textDecoration: 'none' }}
            >
              <div className="flex items-center" style={{ gap: '12px' }}>
                <span style={{ color: 'var(--text-tertiary)' }}>{icon}</span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{label}</span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '16px',
            fontSize: 'var(--text-base)',
            marginTop: '4px',
            opacity: isPending ? 0.5 : 1,
          }}
        >
          {saved ? 'Sauvegarde !' : isPending ? 'Sauvegarde...' : 'Sauvegarder les reglages'}
        </button>

        {/* ── Templates Section ── */}
        <div style={{
          borderTop: '1px solid var(--border-default)',
          paddingTop: '24px',
          marginTop: '12px',
        }}>
          <p style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 650,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '16px',
          }}>
            Modeles de depenses & revenus
          </p>

          {/* Expense Templates */}
          <ExpenseTemplateManager
            expenses={expenses}
            sections={sections}
            cards={cards}
          />

          {/* Spacer */}
          <div style={{ height: '24px' }} />

          {/* Income Templates */}
          <IncomeTemplateManager incomes={incomes} />
        </div>
      </div>
    </div>
  );
}
