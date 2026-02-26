export const dynamic = 'force-dynamic';

import { getSettings } from '@/lib/actions/settings';
import ParametresClient from '@/components/ParametresClient';

export default async function ParametresPage() {
  const settings = await getSettings();
  return <ParametresClient settings={settings} />;
}
