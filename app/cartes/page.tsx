import { getCards } from '@/lib/actions/cards';
import CartesClient from '@/components/CartesClient';

export default async function CartesPage() {
  const cards = await getCards();
  return <CartesClient cards={cards} />;
}
