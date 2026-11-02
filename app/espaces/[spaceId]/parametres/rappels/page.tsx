
import { pageSpace } from "@/lib/spaces/page";
export const dynamic = 'force-dynamic';

import { getSettings } from "@/lib/actions/financial/settings";
import RappelsClient from '@/components/parametres/RappelsClient';

export default async function RappelsPage({ params }: { params: Promise<{spaceId:string}> }) {
  const spaceId = await pageSpace(params);

  const settings = await getSettings(spaceId);
  return <RappelsClient currentReminders={settings.default_reminder_offsets ?? [1, 3, 7]} />;
}
