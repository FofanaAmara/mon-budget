
import { pageSpace } from "@/lib/spaces/page";
export const dynamic = 'force-dynamic';

import { getSettings } from "@/lib/actions/financial/settings";
import DeviseClient from '@/components/parametres/DeviseClient';

export default async function DevisePage({ params }: { params: Promise<{spaceId:string}> }) {
  const spaceId = await pageSpace(params);

  const settings = await getSettings(spaceId);
  return <DeviseClient currentCurrency={settings.default_currency ?? "CAD"} />;
}
