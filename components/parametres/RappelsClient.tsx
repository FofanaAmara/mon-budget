'use client';

import {useSpaceDraft} from "@/components/spaces/SpaceContext";
import {useFinancialRouter} from "@/components/spaces/navigation";
import { useFinancialSpace } from "@/components/spaces/SpaceContext";


import { useState, useTransition } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import { updateSettings } from "@/lib/actions/financial/settings";

const REMINDER_OPTIONS = [1, 3, 7, 14, 30];

type Props = {
  currentReminders: number[];
};

export default function RappelsClient({ currentReminders }: Props) {
  const { spaceId } = useFinancialSpace();

  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [reminders, setReminders] = useState<number[]>(currentReminders);

  useSpaceDraft(JSON.stringify([...reminders].sort()) !== JSON.stringify([...currentReminders].sort()));
  const router = useFinancialRouter();

  function toggleReminder(day: number) {
    setReminders((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  }

  function handleSave() {
    startTransition(async () => {
      await updateSettings(spaceId, { default_reminder_offsets: reminders });
      router.refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div style={{ padding: '36px 20px 96px', minHeight: '100vh' }}>
      <Breadcrumb items={[
        { label: 'Reglages', href: '/parametres' },
        { label: 'Rappels' },
      ]} />
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 750,
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
        }}>
          Rappels par defaut
        </h1>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          Nombre de jours avant l&apos;echeance pour recevoir un rappel
        </p>
      </div>

      <div className="card" style={{ padding: '20px' }}>
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
