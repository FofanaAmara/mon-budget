'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { loadDemoData } from '@/lib/actions/demo-data';

const STORAGE_KEY = 'mes-finances-onboarding-done';

type Props = {
  onComplete: () => void;
};

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function markDone() {
    localStorage.setItem(STORAGE_KEY, 'true');
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

  function handleConfig() {
    markDone();
    router.push('/parametres/charges');
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--surface-ground)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>

        {/* ─── Step 1: Welcome ─── */}
        {step === 0 && (
          <div style={{ animation: 'onb-fade-in 0.3s ease' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>💰</div>
            <h1 style={{
              fontSize: 'var(--text-2xl)', fontWeight: 750,
              color: 'var(--text-primary)', marginBottom: '12px',
              letterSpacing: 'var(--tracking-tight)',
            }}>
              Bienvenue sur Mes Finances !
            </h1>
            <p style={{
              fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
              lineHeight: '1.6', marginBottom: '40px',
            }}>
              L&apos;app qui t&apos;aide a suivre tes depenses, revenus et patrimoine chaque mois.
            </p>
            <button onClick={() => setStep(1)} style={primaryBtnStyle}>
              Suivant →
            </button>
          </div>
        )}

        {/* ─── Step 2: How it works ─── */}
        {step === 1 && (
          <div style={{ animation: 'onb-fade-in 0.3s ease' }}>
            <h1 style={{
              fontSize: 'var(--text-2xl)', fontWeight: 750,
              color: 'var(--text-primary)', marginBottom: '24px',
              letterSpacing: 'var(--tracking-tight)',
            }}>
              Comment ca marche ?
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', marginBottom: '36px' }}>
              {HOW_STEPS.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '14px', alignItems: 'flex-start',
                  background: 'var(--surface-raised)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '16px',
                }}>
                  <span style={{
                    flexShrink: 0, width: '28px', height: '28px',
                    borderRadius: '50%', background: 'var(--accent)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'var(--text-xs)', fontWeight: 700,
                  }}>{i + 1}</span>
                  <div>
                    <p style={{ fontWeight: 650, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {s.title}
                    </p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(2)} style={primaryBtnStyle}>
              Suivant →
            </button>
          </div>
        )}

        {/* ─── Step 3: Choose ─── */}
        {step === 2 && (
          <div style={{ animation: 'onb-fade-in 0.3s ease' }}>
            <h1 style={{
              fontSize: 'var(--text-2xl)', fontWeight: 750,
              color: 'var(--text-primary)', marginBottom: '24px',
              letterSpacing: 'var(--tracking-tight)',
            }}>
              Par ou commencer ?
            </h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {/* Demo option */}
              <button
                onClick={handleDemo}
                disabled={isPending}
                style={{
                  textAlign: 'left', padding: '20px',
                  background: 'var(--accent)', color: 'white',
                  border: 'none', borderRadius: 'var(--radius-lg)',
                  cursor: isPending ? 'wait' : 'pointer',
                  opacity: isPending ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>✨</span>
                  <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>
                    {isPending ? 'Chargement...' : 'Explorer avec la demo'}
                  </span>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', opacity: 0.85, lineHeight: '1.5' }}>
                  Charge des donnees realistes pour decouvrir l&apos;app. Tu pourras les effacer plus tard dans les Reglages.
                </p>
              </button>

              {/* Config option */}
              <button
                onClick={handleConfig}
                disabled={isPending}
                style={{
                  textAlign: 'left', padding: '20px',
                  background: 'var(--surface-raised)', color: 'var(--text-primary)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  opacity: isPending ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>⚙️</span>
                  <span style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
                    Configurer mes donnees
                  </span>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Va directement dans les Reglages pour ajouter tes charges fixes et revenus.
                </p>
              </button>
            </div>

            {error && (
              <p style={{ color: '#DC2626', fontSize: 'var(--text-xs)', marginBottom: '12px' }}>{error}</p>
            )}

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>
              Tu pourras toujours charger ou effacer la demo depuis les Reglages.
            </p>
          </div>
        )}

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '32px' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: step === i ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes onb-fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Constants ─────────────────────────────────

const HOW_STEPS = [
  { title: 'Configure tes charges fixes', desc: 'Loyer, internet, abonnements... dans Reglages → Charges fixes' },
  { title: 'Ajoute tes revenus recurrents', desc: 'Salaire, freelance... dans Reglages → Revenus' },
  { title: 'Chaque mois, tout se genere', desc: 'Tu n\'as qu\'a marquer ce qui est paye ou recu' },
];

const primaryBtnStyle: React.CSSProperties = {
  width: '100%', padding: '14px',
  fontSize: 'var(--text-sm)', fontWeight: 650,
  background: 'var(--accent)', color: 'white',
  border: 'none', borderRadius: 'var(--radius-lg)',
  cursor: 'pointer',
};
