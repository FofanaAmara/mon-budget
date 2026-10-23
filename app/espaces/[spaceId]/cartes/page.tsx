
import { pageSpace } from "@/lib/spaces/page";
export const dynamic = 'force-dynamic';

import { getCards } from "@/lib/actions/financial/cards";
import CartesClient from '@/components/CartesClient';

export default async function CartesPage({ params }: { params: Promise<{spaceId:string}> }) {
  const spaceId = await pageSpace(params);

  const cards = await getCards(spaceId);
  return <CartesClient cards={cards} />;
}
