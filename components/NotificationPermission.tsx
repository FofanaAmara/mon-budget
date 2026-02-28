'use client';

import { useState, useEffect, useRef } from 'react';

export default function NotificationPermission() {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    const perm = Notification.permission;
    // Queue updates to avoid synchronous setState inside effect
    Promise.resolve().then(() => {
      setPermission(perm);
      if (perm === 'default') setShow(true);
    });
  }, []);

  async function requestPermission() {
    const result = await Notification.requestPermission();
    setPermission(result);
    setShow(false);

    if (result === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready;
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;

        const existing = await reg.pushManager.getSubscription();
        const subscription =
          existing ??
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidKey,
          }));

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        });
      } catch (err) {
        console.error('Push subscribe error:', err);
      }
    }
  }

  if (!show || permission !== 'default') return null;

  return (
    <div style={{
      margin: '0 16px 16px',
      background: 'var(--accent-subtle)',
      border: '1px solid var(--accent-muted)',
      borderRadius: 'var(--radius-lg)',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🔔</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 650, color: 'var(--accent)' }}>
          Activer les notifications
        </p>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', opacity: 0.7 }}>
          Recevez des rappels avant vos echeances
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => setShow(false)}
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
            padding: '4px 8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Plus tard
        </button>
        <button
          onClick={requestPermission}
          className="btn-primary"
          style={{
            fontSize: 'var(--text-xs)',
            padding: '6px 12px',
          }}
        >
          Activer
        </button>
      </div>
    </div>
  );
}
