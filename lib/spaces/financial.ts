import { revalidatePath } from "next/cache";
import { SpaceAccessError } from "./context";
import { sql } from "@/lib/db";

export function requireFinancialRecord<T>(record: T | undefined): T {
  if (!record) throw new SpaceAccessError("Cet élément est introuvable ou inaccessible dans cet espace.");
  return record;
}

/** Invalidate only the explicit target; never another tab's selected space. */
export function revalidateSpace(spaceId: string) {
  revalidatePath(`/espaces/${spaceId}`, "layout");
}

export async function requireFinancialParents(spaceId: string, parents: {
  card_id?: string | null; section_id?: string | null; project_id?: string | null;
}) {
  const rows = await sql`SELECT
    (${parents.card_id ?? null}::uuid IS NULL OR EXISTS(SELECT 1 FROM cards WHERE space_id=${spaceId} AND id=${parents.card_id ?? null}))
    AND (${parents.section_id ?? null}::uuid IS NULL OR EXISTS(SELECT 1 FROM sections WHERE space_id=${spaceId} AND id=${parents.section_id ?? null}))
    AND (${parents.project_id ?? null}::uuid IS NULL OR EXISTS(SELECT 1 FROM expenses WHERE space_id=${spaceId} AND id=${parents.project_id ?? null} AND type='PLANNED')) AS valid`;
  if (!rows[0]?.valid) throw new SpaceAccessError("Une référence est introuvable ou inaccessible dans cet espace.");
}
