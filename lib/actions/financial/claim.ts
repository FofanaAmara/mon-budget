"use server";

import { sql } from "@/lib/db";
import { DEFAULT_SECTIONS } from "@/lib/constants";
import { requireSpace } from "@/lib/spaces/context";

/** Legacy ownership is resolved by the checked migration, never by a signed-in visitor. */
export async function ensureDefaultSections(spaceId:string):Promise<void> {
  const {userId}=await requireSpace(spaceId);
  await sql.transaction(txn=>[
    txn`SELECT id FROM financial_spaces WHERE id=${spaceId} FOR NO KEY UPDATE`,
    txn`INSERT INTO sections(space_id,user_id,name,icon,color,position)
      SELECT ${spaceId},${userId},name,icon,color,position
      FROM jsonb_to_recordset(${JSON.stringify(DEFAULT_SECTIONS)}::jsonb) AS d(name text,icon text,color text,position integer)
      WHERE NOT EXISTS(SELECT 1 FROM sections WHERE space_id=${spaceId})`,
  ]);
}
