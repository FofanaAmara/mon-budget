export const dynamic = 'force-dynamic';

import { getSettings } from '@/lib/actions/settings';
import NotificationsClient from '@/components/parametres/NotificationsClient';

export default async function NotificationsPage() {
  const settings = await getSettings();
  return (
    <NotificationsClient
      settingsId={settings.id}
      currentEmail={settings.email ?? ''}
      currentPhone={settings.phone ?? ''}
      currentNotifyPush={settings.notify_push}
      currentNotifyEmail={settings.notify_email}
    />
  );
}
