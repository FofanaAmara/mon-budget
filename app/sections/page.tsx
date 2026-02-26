export const dynamic = 'force-dynamic';

import { getSections } from '@/lib/actions/sections';
import SectionsClient from '@/components/SectionsClient';

export default async function SectionsPage() {
  const sections = await getSections();
  return <SectionsClient sections={sections} />;
}
