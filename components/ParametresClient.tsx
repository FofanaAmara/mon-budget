'use client';

import { useState, useTransition } from 'react';
import { updateSettings } from '@/lib/actions/settings';
import type { Settings } from '@/lib/types';

const CURRENCIES = ['CAD', 'USD', 'EUR'];
const REMINDER_OPTIONS = [1, 3, 7, 14, 30];

export default function ParametresClient({ settings }: { settings: Settings }) {
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
    <div className="px-4 pt-8 pb-6 min-h-screen">
      <h1 className="text-2xl font-bold text-[#1E293B] mb-6">Réglages</h1>

      <div className="space-y-4">
        {/* Currency */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Devise par défaut</h2>
          <div className="flex gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currency === c
                    ? 'bg-[#1E293B] text-white'
                    : 'bg-[#F8FAFC] text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Reminders */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-[#1E293B] mb-1">Rappels par défaut</h2>
          <p className="text-xs text-[#94A3B8] mb-3">Jours avant l&apos;échéance</p>
          <div className="flex gap-2 flex-wrap">
            {REMINDER_OPTIONS.map((day) => (
              <button
                key={day}
                onClick={() => toggleReminder(day)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  reminders.includes(day)
                    ? 'bg-[#1E293B] text-white'
                    : 'bg-[#F8FAFC] text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#1E293B]'
                }`}
              >
                {day}j
              </button>
            ))}
          </div>
        </div>

        {/* Contact info for notifications */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-[#1E293B] mb-1">Contact</h2>
          <p className="text-xs text-[#94A3B8] mb-3">Pour les notifications email et SMS</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#94A3B8] mb-1 block">📧 Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1E293B] placeholder:text-[#CBD5E1] focus:outline-none focus:border-[#2563EB] bg-[#F8FAFC]"
              />
            </div>
            <div>
              <label className="text-xs text-[#94A3B8] mb-1 block">📱 Téléphone (SMS)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 514 000 0000"
                className="w-full px-3 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1E293B] placeholder:text-[#CBD5E1] focus:outline-none focus:border-[#2563EB] bg-[#F8FAFC]"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Canaux de notification</h2>
          <div className="space-y-3">
            {[
              { label: '🔔 Notifications push', value: notifyPush, onChange: setNotifyPush },
              { label: '📧 Email', value: notifyEmail, onChange: setNotifyEmail },
            ].map(({ label, value, onChange }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-[#1E293B]">{label}</span>
                <button
                  onClick={() => onChange(!value)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-[#1E293B]' : 'bg-[#E2E8F0]'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full bg-[#1E293B] text-white rounded-2xl py-4 font-semibold text-sm disabled:opacity-50 transition-all"
        >
          {saved ? '✓ Sauvegardé !' : isPending ? 'Sauvegarde…' : 'Sauvegarder les réglages'}
        </button>
      </div>
    </div>
  );
}
