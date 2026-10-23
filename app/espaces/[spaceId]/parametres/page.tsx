
import { pageSpace } from "@/lib/spaces/page";
export const dynamic = 'force-dynamic';

import ParametresClient from '@/components/ParametresClient';
import { hasUserData } from "@/lib/actions/financial/demo-data";

export default async function ParametresPage({ params }: { params: Promise<{spaceId:string}> }) {
  const spaceId = await pageSpace(params);

  const hasData = await hasUserData(spaceId);
  return <ParametresClient hasData={hasData} />;
}
