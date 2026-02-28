export const dynamic = 'force-dynamic';

import ParametresClient from '@/components/ParametresClient';
import { hasUserData } from '@/lib/actions/demo-data';

export default async function ParametresPage() {
  const hasData = await hasUserData();
  return <ParametresClient hasData={hasData} />;
}
