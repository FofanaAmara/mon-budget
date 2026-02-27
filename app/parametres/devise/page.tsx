export const dynamic = 'force-dynamic';

import { getSettings } from '@/lib/actions/settings';
import DeviseClient from '@/components/parametres/DeviseClient';

export default async function DevisePage() {
  const settings = await getSettings();
  return <DeviseClient settingsId={settings.id} currentCurrency={settings.default_currency} />;
}
