'use client';

import { useState, useEffect } from 'react';

export default function NotificationPermission() {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    setPermission(Notification.permission);
    if (Notification.permission === 'default') {
      setShow(true);
    }
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
    <div className="mx-4 mb-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 flex items-center gap-3">
      <span className="text-2xl flex-shrink-0">🔔</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1E40AF]">Activer les notifications</p>
        <p className="text-xs text-[#3B82F6]">Recevez des rappels avant vos échéances</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => setShow(false)}
          className="text-xs text-[#94A3B8] px-2 py-1"
        >
          Plus tard
        </button>
        <button
          onClick={requestPermission}
          className="text-xs font-semibold bg-[#2563EB] text-white px-3 py-1.5 rounded-lg"
        >
          Activer
        </button>
      </div>
    </div>
  );
}
