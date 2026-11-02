
import { pageSpace } from "@/lib/spaces/page";
import { getExpenseById } from "@/lib/actions/financial/expenses";
import { getSections } from "@/lib/actions/financial/sections";
import { getCards } from "@/lib/actions/financial/cards";
import Breadcrumb from "@/components/Breadcrumb";
import EditExpenseClient from "@/components/EditExpenseClient";
import { notFound } from "next/navigation";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ spaceId:string;  id: string }>;
}) {
  const spaceId = await pageSpace(params);

  const { id } = await params;
  const [expense, sections, cards] = await Promise.all([
    getExpenseById(spaceId, id),
    getSections(spaceId),
    getCards(spaceId),
  ]);
  if (!expense) notFound();

  return (
    <div style={{ padding: "36px 20px 96px", minHeight: "100vh" }}>
      <Breadcrumb
        items={[
          { label: "Reglages", href: "/parametres" },
          { label: "Mes dépenses récurrentes", href: "/parametres/charges" },
          { label: "Modifier" },
        ]}
      />
      <EditExpenseClient expense={expense} sections={sections} cards={cards} />
    </div>
  );
}
