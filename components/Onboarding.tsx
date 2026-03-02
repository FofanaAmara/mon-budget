'use client';

import { useState, useTransition } from 'react';
import { loadDemoData } from '@/lib/actions/demo-data';

const STORAGE_KEY = 'mes-finances-onboarding-done';

type Frequency = 'weekly' | 'biweekly' | 'monthly';

type Props = {
  onComplete: () => void;
};

// ─── Categories (from maquette) ─────────────────────────────────
const CATEGORIES = [
  { id: 'logement',     emoji: '🏠', label: 'Logement',     defaultSelected: true },
  { id: 'epicerie',     emoji: '🛒', label: 'Épicerie',     defaultSelected: true },
  { id: 'transport',    emoji: '🚗', label: 'Transport',    defaultSelected: true },
  { id: 'services',     emoji: '💡', label: 'Services',     defaultSelected: false },
  { id: 'restos',       emoji: '🍽️', label: 'Restos',       defaultSelected: false },
  { id: 'loisirs',      emoji: '🎬', label: 'Loisirs',      defaultSelected: false },
  { id: 'sante',        emoji: '🏥', label: 'Santé',        defaultSelected: true },
  { id: 'vetements',    emoji: '👕', label: 'Vêtements',    defaultSelected: false },
  { id: 'abonnements',  emoji: '📱', label: 'Abonnements',  defaultSelected: false },
  { id: 'education',    emoji: '🎓', label: 'Éducation',    defaultSelected: false },
  { id: 'animaux',      emoji: '🐶', label: 'Animaux',      defaultSelected: false },
  { id: 'cadeaux',      emoji: '🎁', label: 'Cadeaux',      defaultSelected: false },
];

// ─── Objectives (from maquette) ─────────────────────────────────
const OBJECTIVES = [
  {
    id: 'reduire',
    emoji: '💸',
    name: 'Réduire mes dépenses',
    desc: 'Identifier où va mon argent et couper le superflu',
  },
  {
    id: 'epargner',
    emoji: '🏦',
    name: 'Épargner plus',
    desc: "Mettre de côté pour un projet ou un fonds d'urgence",
  },
  {
    id: 'suivre',
    emoji: '📊',
    name: 'Suivre mon budget',
    desc: 'Avoir une vue claire de mes revenus et dépenses chaque mois',
  },
  {
    id: 'objectif',
    emoji: '🏠',
    name: 'Atteindre un objectif précis',
    desc: 'Voyage, mise de fonds, achat important',
  },
];

// ─── Monthly conversion helpers ─────────────────────────────────
function toMonthly(amount: number, freq: Frequency): number {
  if (freq === 'weekly')   return amount * 4.33;
  if (freq === 'biweekly') return amount * 2.17;
  return amount; // monthly
}

function previewLabel(amount: number, freq: Frequency): string {
  const monthly = Math.round(toMonthly(amount, freq));
  const fmt = (n: number) => n.toLocaleString('fr-CA');
  if (freq === 'weekly')   return `${fmt(amount)} × 4,33 = ${fmt(monthly)} $ / mois`;
  if (freq === 'biweekly') return `${fmt(monthly)} $ / mois (basé sur 2× par mois)`;
  return `${fmt(monthly)} $ / mois`;
}

// ─── Component ───────────────────────────────────────────────────
export default function Onboarding({ onComplete }: Props) {
  // Navigation
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: revenue
  const [amount, setAmount]       = useState('');
  const [frequency, setFrequency] = useState<Frequency>('biweekly');

  // Step 2: categories
  const [selected, setSelected]   = useState<Set<string>>(
    new Set(CATEGORIES.filter(c => c.defaultSelected).map(c => c.id))
  );

  // Step 3: objective
  const [objective, setObjective] = useState<string | null>(null);

  // Demo data loading
  const [isPending, startTransition] = useTransition();
  const [error, setError]           = useState<string | null>(null);

  // ─── Helpers ───────────────────────────────────────────────────
  function markDone() {
    // Persist collected data to localStorage (no server action needed)
    const monthly = amount ? Math.round(toMonthly(parseFloat(amount), frequency)) : 0;
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.setItem('mes-finances-onboarding-revenue', String(monthly));
    localStorage.setItem('mes-finances-onboarding-categories', JSON.stringify([...selected]));
    localStorage.setItem('mes-finances-onboarding-objective', objective ?? '');
    onComplete();
  }

  function handleDemo() {
    setError(null);
    startTransition(async () => {
      const result = await loadDemoData();
      if (result.success) {
        localStorage.setItem(STORAGE_KEY, 'true');
        window.location.href = '/';
      } else {
        setError(result.error ?? 'Erreur inconnue');
      }
    });
  }

  function toggleCategory(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ─── Progress bar segments ─────────────────────────────────────
  function segmentStyle(idx: number): React.CSSProperties {
    const isCompleted = idx < step;
    const isActive    = idx === step;
    return {
      flex: 1,
      height: '4px',
      borderRadius: '2px',
      background: isCompleted
        ? '#0F766E'
        : isActive
        ? '#F59E0B'
        : 'rgba(15,118,110,0.1)',
      transition: 'background 0.4s ease',
    };
  }

  // ─── Derived values ────────────────────────────────────────────
  const parsedAmount  = parseFloat(amount) || 0;
  const hasAmount     = parsedAmount > 0;
  const catCount      = selected.size;
  const hasCategories = catCount > 0;
  const hasObjective  = objective !== null;

  return (
    <>
      {/* ── Scoped styles: background gradients + animations ── */}
      <style>{`
        @keyframes onb-card-enter {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes onb-step-in {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes onb-preview-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .onb-layout::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 100%, rgba(15,118,110,0.04), transparent),
            radial-gradient(ellipse 60% 40% at 80% 10%,  rgba(245,158,11,0.03), transparent);
          pointer-events: none;
          z-index: 0;
        }
        .onb-freq-btn { transition: all 0.2s ease; }
        .onb-freq-btn:hover { border-color: #CBD5E1 !important; color: #334155 !important; }
        .onb-cat-chip { transition: all 0.2s ease; cursor: pointer; }
        .onb-cat-chip:hover { border-color: #CBD5E1 !important; background: #FAFBFC !important; }
        .onb-obj-card { transition: all 0.2s ease; cursor: pointer; }
        .onb-obj-card:hover { border-color: #CBD5E1 !important; background: #FAFBFC !important; }
        .onb-btn-next:hover:not(:disabled) {
          background: #115E59 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(15,118,110,0.25);
        }
        .onb-btn-next:active:not(:disabled) { transform: translateY(0); }
        .onb-btn-back:hover {
          background: #FAFBFC !important;
          border-color: #CBD5E1 !important;
          color: #334155 !important;
        }
        .onb-btn-finish:hover:not(:disabled) {
          background: #D97706 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245,158,11,0.3);
        }
        .onb-btn-finish:active:not(:disabled) { transform: translateY(0); }
        .onb-revenue-wrapper:focus-within { border-color: #0F766E !important; box-shadow: 0 0 0 4px rgba(15,118,110,0.08) !important; background: #FFFFFF !important; }
        .onb-revenue-wrapper:focus-within .onb-currency { color: #0F766E !important; }
        /* Remove number spinner */
        .onb-amount-input::-webkit-inner-spin-button,
        .onb-amount-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .onb-amount-input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* ── Full-screen overlay ── */}
      <div
        className="onb-layout"
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#F0FDFA',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '24px 20px 48px',
          overflowY: 'auto', overflowX: 'hidden',
        }}
      >

        {/* ── Top bar ── */}
        <div style={{
          width: '100%', maxWidth: '560px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '32px', position: 'relative', zIndex: 1,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="#0F766E"/>
              <path d="M12 28 C12 28, 16 24, 20 18 C24 12, 28 10, 28 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <circle cx="28" cy="10" r="3" fill="#F59E0B"/>
            </svg>
            <div style={{ fontSize: '18px', letterSpacing: '-0.02em', lineHeight: 1 }}>
              <b style={{ fontWeight: 800, color: '#0F766E' }}>Mes</b>
              <span style={{ fontWeight: 600, color: '#94A3B8' }}> Finances</span>
            </div>
          </div>
          {/* Step counter */}
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.02em' }}>
            Étape{' '}
            <span style={{ fontWeight: 800, color: '#0F766E' }}>{step}</span>
            {' '}/ 3
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div style={{
          display: 'flex', gap: '8px',
          width: '100%', maxWidth: '560px',
          marginBottom: '24px', position: 'relative', zIndex: 1,
        }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={segmentStyle(i)} />
          ))}
        </div>

        {/* ── Card ── */}
        <div style={{
          width: '100%', maxWidth: '560px',
          background: '#FFFFFF',
          borderRadius: '18px',
          boxShadow: '0 16px 48px rgba(15,118,110,0.14)',
          padding: '32px 24px 28px',
          position: 'relative', zIndex: 1,
          animation: 'onb-card-enter 0.5s cubic-bezier(0.4,0,0.2,1) both',
        }}>

          {/* ══════════ STEP 1: REVENU ══════════ */}
          {step === 1 && (
            <div style={{ animation: 'onb-step-in 0.4s ease both' }}>
              <span style={{ fontSize: '36px', display: 'block', lineHeight: 1, marginBottom: '12px' }} role="img" aria-label="Argent">💰</span>
              <h1 style={{
                fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em',
                lineHeight: 1.1, color: '#0F172A', marginBottom: '8px',
              }}>
                Ton revenu mensuel
              </h1>
              <p style={{
                fontSize: '15px', fontWeight: 400, color: '#64748B',
                lineHeight: 1.5, marginBottom: '28px', letterSpacing: '-0.01em',
              }}>
                Combien gagnes-tu ? On utilise ce montant pour{' '}
                <strong style={{ color: '#0F766E', fontWeight: 600 }}>calculer ton budget automatiquement</strong>.
              </p>

              {/* Amount input */}
              <div style={{ marginBottom: '20px' }}>
                <div
                  className="onb-revenue-wrapper"
                  style={{
                    display: 'flex', alignItems: 'center',
                    background: '#FAFBFC',
                    border: '2px solid #E2E8F0',
                    borderRadius: '12px',
                    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
                    overflow: 'hidden',
                  }}
                >
                  <span
                    className="onb-currency"
                    style={{
                      padding: '16px 0 16px 18px',
                      fontSize: '28px', fontWeight: 800,
                      color: '#CBD5E1', letterSpacing: '-0.03em',
                      userSelect: 'none', transition: 'color 0.2s', lineHeight: 1,
                    }}
                  >
                    $
                  </span>
                  <input
                    type="number"
                    className="onb-amount-input"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="3 500"
                    min="0"
                    step="100"
                    inputMode="numeric"
                    style={{
                      flex: 1, border: 'none', background: 'transparent',
                      padding: '16px 18px 16px 8px',
                      fontFamily: 'inherit',
                      fontSize: '28px', fontWeight: 800,
                      color: '#0F172A', letterSpacing: '-0.03em',
                      lineHeight: 1, outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Frequency selector */}
              <div style={{ marginBottom: '24px' }}>
                <span style={{
                  display: 'block',
                  fontSize: '13px', fontWeight: 600, color: '#64748B',
                  marginBottom: '8px', letterSpacing: '0.01em',
                }}>
                  Fréquence de paie
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(
                    [
                      { value: 'weekly',   label: 'Hebdo' },
                      { value: 'biweekly', label: 'Aux 2 sem.' },
                      { value: 'monthly',  label: 'Mensuel' },
                    ] as { value: Frequency; label: string }[]
                  ).map(opt => (
                    <button
                      key={opt.value}
                      className="onb-freq-btn"
                      onClick={() => setFrequency(opt.value)}
                      style={{
                        flex: 1, padding: '10px 8px',
                        background: frequency === opt.value ? '#F0FDFA' : '#FFFFFF',
                        border: `1.5px solid ${frequency === opt.value ? '#0F766E' : '#E2E8F0'}`,
                        borderRadius: '8px',
                        fontFamily: 'inherit',
                        fontSize: '13px', fontWeight: 600,
                        color: frequency === opt.value ? '#0F766E' : '#64748B',
                        cursor: 'pointer',
                        textAlign: 'center',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview — visible only when amount > 0 */}
              {hasAmount && (
                <div
                  style={{
                    background: '#F0FDFA', borderRadius: '12px',
                    padding: '16px 18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '4px',
                    animation: 'onb-preview-in 0.3s ease both',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>
                    Revenu mensuel estimé
                  </span>
                  <span style={{
                    fontSize: '18px', fontWeight: 800, color: '#0F766E',
                    letterSpacing: '-0.02em',
                  }}>
                    {previewLabel(parsedAmount, frequency)}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                <button
                  className="onb-btn-next"
                  onClick={() => setStep(2)}
                  disabled={!hasAmount}
                  style={{
                    flex: 1, padding: '14px 24px',
                    background: '#0F766E', color: '#FFFFFF',
                    fontFamily: 'inherit',
                    fontSize: '15px', fontWeight: 700,
                    border: 'none', borderRadius: '12px',
                    cursor: hasAmount ? 'pointer' : 'not-allowed',
                    letterSpacing: '-0.01em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    opacity: hasAmount ? 1 : 0.5,
                    transition: 'all 0.2s ease',
                  }}
                >
                  Continuer
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 3l5 5-5 5"/></svg>
                </button>
              </div>

              {/* Demo link — subtle, step 1 only */}
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <span style={{ fontSize: '13px', color: '#94A3B8' }}>
                  Ou{' '}
                  <button
                    onClick={handleDemo}
                    disabled={isPending}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      fontSize: '13px', color: '#94A3B8',
                      textDecoration: 'underline', cursor: isPending ? 'wait' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {isPending ? 'Chargement...' : 'explorer avec des données de test'}
                  </button>
                </span>
                {error && (
                  <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '8px' }}>{error}</p>
                )}
              </div>
            </div>
          )}

          {/* ══════════ STEP 2: CATÉGORIES ══════════ */}
          {step === 2 && (
            <div style={{ animation: 'onb-step-in 0.4s ease both' }}>
              <span style={{ fontSize: '36px', display: 'block', lineHeight: 1, marginBottom: '12px' }} role="img" aria-label="Dossier">📂</span>
              <h1 style={{
                fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em',
                lineHeight: 1.1, color: '#0F172A', marginBottom: '8px',
              }}>
                Tes catégories
              </h1>
              <p style={{
                fontSize: '15px', fontWeight: 400, color: '#64748B',
                lineHeight: 1.5, marginBottom: '28px', letterSpacing: '-0.01em',
              }}>
                Sélectionne les catégories de dépenses que tu utilises. Tu pourras les{' '}
                <strong style={{ color: '#0F766E', fontWeight: 600 }}>modifier plus tard</strong>.
              </p>

              {/* Category grid */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px', marginBottom: '24px',
              }}>
                {CATEGORIES.map(cat => {
                  const isSelected = selected.has(cat.id);
                  return (
                    <div
                      key={cat.id}
                      className="onb-cat-chip"
                      onClick={() => toggleCategory(cat.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '14px',
                        background: isSelected ? '#F0FDFA' : '#FFFFFF',
                        border: `1.5px solid ${isSelected ? '#0F766E' : '#E2E8F0'}`,
                        borderRadius: '12px',
                        userSelect: 'none',
                      }}
                    >
                      <span style={{ fontSize: '20px', lineHeight: 1, flexShrink: 0 }} role="img">
                        {cat.emoji}
                      </span>
                      <span style={{
                        fontSize: '13px', fontWeight: 600, color: '#334155',
                        letterSpacing: '-0.01em', flex: 1, lineHeight: 1.3,
                      }}>
                        {cat.label}
                      </span>
                      {/* Checkbox */}
                      <span style={{
                        width: '20px', height: '20px', borderRadius: '5px',
                        border: `1.5px solid ${isSelected ? '#0F766E' : '#CBD5E1'}`,
                        background: isSelected ? '#0F766E' : '#FFFFFF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'all 0.2s ease',
                      }}>
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 6l3 3 5-5"/>
                          </svg>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Counter */}
              <div style={{
                fontSize: '13px', fontWeight: 500, color: '#94A3B8',
                textAlign: 'center', marginBottom: '4px',
              }}>
                <span style={{ fontWeight: 700, color: '#0F766E' }}>{catCount}</span> catégorie{catCount !== 1 ? 's' : ''} sélectionnée{catCount !== 1 ? 's' : ''}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                <button
                  className="onb-btn-back"
                  onClick={() => setStep(1)}
                  style={{
                    padding: '14px 20px',
                    background: 'transparent', color: '#64748B',
                    fontFamily: 'inherit',
                    fontSize: '15px', fontWeight: 600,
                    border: '1.5px solid #E2E8F0', borderRadius: '12px',
                    cursor: 'pointer', letterSpacing: '-0.01em',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 3l-5 5 5 5"/></svg>
                  Retour
                </button>
                <button
                  className="onb-btn-next"
                  onClick={() => setStep(3)}
                  disabled={!hasCategories}
                  style={{
                    flex: 1, padding: '14px 24px',
                    background: '#0F766E', color: '#FFFFFF',
                    fontFamily: 'inherit',
                    fontSize: '15px', fontWeight: 700,
                    border: 'none', borderRadius: '12px',
                    cursor: hasCategories ? 'pointer' : 'not-allowed',
                    letterSpacing: '-0.01em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    opacity: hasCategories ? 1 : 0.5,
                    transition: 'all 0.2s ease',
                  }}
                >
                  Continuer
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 3l5 5-5 5"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* ══════════ STEP 3: OBJECTIF ══════════ */}
          {step === 3 && (
            <div style={{ animation: 'onb-step-in 0.4s ease both' }}>
              <span style={{ fontSize: '36px', display: 'block', lineHeight: 1, marginBottom: '12px' }} role="img" aria-label="Cible">🎯</span>
              <h1 style={{
                fontSize: '28px', fontWeight: 800, letterSpacing: '-0.03em',
                lineHeight: 1.1, color: '#0F172A', marginBottom: '8px',
              }}>
                Ton objectif
              </h1>
              <p style={{
                fontSize: '15px', fontWeight: 400, color: '#64748B',
                lineHeight: 1.5, marginBottom: '28px', letterSpacing: '-0.01em',
              }}>
                Qu&apos;est-ce qui te motive à mieux gérer tes finances ? Choisis{' '}
                <strong style={{ color: '#0F766E', fontWeight: 600 }}>un objectif principal</strong>.
              </p>

              {/* Objective cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {OBJECTIVES.map(obj => {
                  const isSelected = objective === obj.id;
                  return (
                    <div
                      key={obj.id}
                      className="onb-obj-card"
                      onClick={() => setObjective(obj.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: '16px',
                        background: isSelected ? '#F0FDFA' : '#FFFFFF',
                        border: `1.5px solid ${isSelected ? '#0F766E' : '#E2E8F0'}`,
                        borderRadius: '12px',
                        userSelect: 'none',
                        boxShadow: isSelected ? '0 0 0 3px rgba(15,118,110,0.06)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Icon */}
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '8px',
                        background: isSelected ? 'rgba(15,118,110,0.08)' : '#F1F5F9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '22px', flexShrink: 0, transition: 'background 0.2s',
                      }}>
                        {obj.emoji}
                      </div>
                      {/* Text */}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '15px', fontWeight: 700, color: '#0F172A',
                          letterSpacing: '-0.01em', marginBottom: '2px',
                        }}>
                          {obj.name}
                        </div>
                        <div style={{
                          fontSize: '13px', fontWeight: 400, color: '#64748B', lineHeight: 1.4,
                        }}>
                          {obj.desc}
                        </div>
                      </div>
                      {/* Radio */}
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%',
                        border: `2px solid ${isSelected ? '#0F766E' : '#CBD5E1'}`,
                        background: isSelected ? '#0F766E' : '#FFFFFF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'all 0.2s ease',
                      }}>
                        {isSelected && (
                          <div style={{
                            width: '8px', height: '8px', borderRadius: '50%', background: '#FFFFFF',
                          }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                <button
                  className="onb-btn-back"
                  onClick={() => setStep(2)}
                  style={{
                    padding: '14px 20px',
                    background: 'transparent', color: '#64748B',
                    fontFamily: 'inherit',
                    fontSize: '15px', fontWeight: 600,
                    border: '1.5px solid #E2E8F0', borderRadius: '12px',
                    cursor: 'pointer', letterSpacing: '-0.01em',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 3l-5 5 5 5"/></svg>
                  Retour
                </button>
                <button
                  className="onb-btn-finish"
                  onClick={markDone}
                  disabled={!hasObjective}
                  style={{
                    flex: 1, padding: '14px 24px',
                    background: '#F59E0B', color: '#0F172A',
                    fontFamily: 'inherit',
                    fontSize: '15px', fontWeight: 700,
                    border: 'none', borderRadius: '12px',
                    cursor: hasObjective ? 'pointer' : 'not-allowed',
                    letterSpacing: '-0.01em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    opacity: hasObjective ? 1 : 0.5,
                    transition: 'all 0.2s ease',
                  }}
                >
                  Accéder à mon tableau de bord
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8l4 4 8-8"/></svg>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Skip link — shown on step 1 only */}
        {step === 1 && (
          <div style={{
            marginTop: '20px', textAlign: 'center',
            position: 'relative', zIndex: 1,
            width: '100%', maxWidth: '560px',
          }}>
            <button
              onClick={markDone}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: '13px', fontWeight: 500, color: '#94A3B8',
                textDecoration: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { (e.target as HTMLButtonElement).style.color = '#64748B'; (e.target as HTMLButtonElement).style.textDecoration = 'underline'; }}
              onMouseLeave={e => { (e.target as HTMLButtonElement).style.color = '#94A3B8'; (e.target as HTMLButtonElement).style.textDecoration = 'none'; }}
            >
              Passer la configuration
            </button>
          </div>
        )}

      </div>
    </>
  );
}
