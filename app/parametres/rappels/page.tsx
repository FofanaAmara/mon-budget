export const dynamic = 'force-dynamic';

import { getSettings } from '@/lib/actions/settings';
import RappelsClient from '@/components/parametres/RappelsClient';

export default async function RappelsPage() {
  const settings = await getSettings();
  return <RappelsClient settingsId={settings.id} currentReminders={settings.default_reminder_offsets ?? [1, 3, 7]} />;
}
