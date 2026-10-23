export const dynamic = 'force-dynamic';

import { getAccountSettings } from '@/lib/actions/account-settings';
import NotificationsClient from '@/components/parametres/NotificationsClient';

export default async function NotificationsPage() {
  const settings = await getAccountSettings();
  return (
    <NotificationsClient
      currentEmail={settings.email ?? ''}
      currentPhone={settings.phone ?? ''}
      currentNotifyPush={settings.notify_push}
      currentNotifyEmail={settings.notify_email}
    />
  );
}
