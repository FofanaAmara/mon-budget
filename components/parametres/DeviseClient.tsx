'use client';

import {useSpaceDraft} from "@/components/spaces/SpaceContext";
import {useFinancialRouter} from "@/components/spaces/navigation";
import { useFinancialSpace } from "@/components/spaces/SpaceContext";


import { useState, useTransition } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import { updateSettings } from "@/lib/actions/financial/settings";

const CURRENCIES = ['CAD', 'USD', 'EUR'];

type Props = {
  currentCurrency: string;
};

export default function DeviseClient({ currentCurrency }: Props) {
  const { spaceId } = useFinancialSpace();

  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [currency, setCurrency] = useState(currentCurrency);

  useSpaceDraft(currency !== currentCurrency);
  const router = useFinancialRouter();

  function handleSave() {
    startTransition(async () => {
      await updateSettings(spaceId, { default_currency: currency });
      router.refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div style={{ padding: '36px 20px 96px', minHeight: '100vh' }}>
      <Breadcrumb items={[
        { label: 'Reglages', href: '/parametres' },
        { label: 'Devise' },
      ]} />
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 750,
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
        }}>
          Devise par defaut
        </h1>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          Choisissez la devise utilisee pour afficher les montants
        </p>
      </div>

      <div className="card" style={{ padding: '20px' }}>
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

      <button
        onClick={handleSave}
        disabled={isPending}
        className="btn-primary"
        style={{
          width: '100%',
          padding: '16px',
          fontSize: 'var(--text-base)',
          marginTop: '16px',
          opacity: isPending ? 0.5 : 1,
        }}
      >
        {saved ? 'Sauvegarde !' : isPending ? 'Sauvegarde...' : 'Sauvegarder'}
      </button>
    </div>
  );
}
