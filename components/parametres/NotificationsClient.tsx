'use client';

import { useState, useTransition } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import { updateSettings } from '@/lib/actions/settings';

type Props = {
  settingsId: string;
  currentEmail: string;
  currentPhone: string;
  currentNotifyPush: boolean;
  currentNotifyEmail: boolean;
};

export default function NotificationsClient({
  settingsId,
  currentEmail,
  currentPhone,
  currentNotifyPush,
  currentNotifyEmail,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const [notifyPush, setNotifyPush] = useState(currentNotifyPush);
  const [notifyEmail, setNotifyEmail] = useState(currentNotifyEmail);
  const [email, setEmail] = useState(currentEmail);
  const [phone, setPhone] = useState(currentPhone);

  function handleSave() {
    startTransition(async () => {
      await updateSettings(settingsId, {
        email: email.trim() || null,
        phone: phone.trim() || null,
        notify_push: notifyPush,
        notify_email: notifyEmail,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div style={{ padding: '36px 20px 96px', minHeight: '100vh' }}>
      <Breadcrumb items={[
        { label: 'Reglages', href: '/parametres' },
        { label: 'Notifications' },
      ]} />
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 750,
          color: 'var(--text-primary)',
          letterSpacing: 'var(--tracking-tight)',
          lineHeight: 'var(--leading-tight)',
        }}>
          Notifications
        </h1>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '4px' }}>
          Canaux de notification et coordonnees
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Channels */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{
            fontSize: 'var(--text-sm)', fontWeight: 650,
            color: 'var(--text-primary)', marginBottom: '16px',
          }}>Canaux</h2>
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

        {/* Contact */}
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{
            fontSize: 'var(--text-sm)', fontWeight: 650,
            color: 'var(--text-primary)', marginBottom: '4px',
          }}>Coordonnees</h2>
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
