
import { pageSpaceContext } from "@/lib/spaces/page";
export const dynamic = 'force-dynamic';

import ParametresClient from '@/components/ParametresClient';
import { hasUserData } from "@/lib/actions/financial/demo-data";

export default async function ParametresPage({ params }: { params: Promise<{spaceId:string}> }) {
  const { spaceId } = await params;
  const { createdByCurrentUser } = await pageSpaceContext(spaceId);

  const hasData = await hasUserData(spaceId);
  return <ParametresClient hasData={hasData} showSetupGuide={createdByCurrentUser} />;
}
