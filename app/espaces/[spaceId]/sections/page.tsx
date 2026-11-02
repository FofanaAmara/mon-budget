
import { pageSpace } from "@/lib/spaces/page";
export const dynamic = 'force-dynamic';

import { getSections } from "@/lib/actions/financial/sections";
import SectionsClient from '@/components/SectionsClient';

export default async function SectionsPage({ params }: { params: Promise<{spaceId:string}> }) {
  const spaceId = await pageSpace(params);

  const sections = await getSections(spaceId);
  return <SectionsClient sections={sections} />;
}
