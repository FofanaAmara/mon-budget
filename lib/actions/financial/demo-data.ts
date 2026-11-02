"use server";

import { sql } from "@/lib/db";
import { DEFAULT_SECTIONS } from "@/lib/constants";
import { requireSpace } from "@/lib/spaces/context";
import { revalidateSpace } from "@/lib/spaces/financial";
import { maintenanceLocks, requireEmptySpace } from "@/lib/spaces/maintenance";
import { demoInsertQueries } from "@/lib/spaces/demo/queries";

export async function hasUserData(spaceId:string):Promise<boolean> {
  await requireSpace(spaceId);
  const [row]=await sql`SELECT EXISTS(
    SELECT 1 FROM expenses WHERE space_id=${spaceId} UNION ALL SELECT 1 FROM incomes WHERE space_id=${spaceId}
    UNION ALL SELECT 1 FROM cards WHERE space_id=${spaceId} UNION ALL SELECT 1 FROM debts WHERE space_id=${spaceId}
    UNION ALL SELECT 1 FROM monthly_expenses WHERE space_id=${spaceId} UNION ALL SELECT 1 FROM monthly_incomes WHERE space_id=${spaceId}
    UNION ALL SELECT 1 FROM income_allocations WHERE space_id=${spaceId} UNION ALL SELECT 1 FROM monthly_allocations WHERE space_id=${spaceId}
  ) AS has_data`;
  return Boolean(row.has_data);
}

export async function loadDemoData(spaceId:string):Promise<{success:boolean;error?:string}> {
  const {userId}=await requireSpace(spaceId);
  try {
    await sql.transaction(txn=>[
      ...maintenanceLocks(txn), requireEmptySpace(txn,spaceId),
      txn`DELETE FROM sections WHERE space_id=${spaceId}`,
      ...demoInsertQueries(txn,spaceId,userId),
      txn`INSERT INTO allocation_sections(space_id,allocation_id,section_id)
        SELECT space_id,id,section_id FROM income_allocations WHERE space_id=${spaceId} AND section_id IS NOT NULL`,
    ]);
  } catch(error) {
    if((error as {code?:string}).code==='22012')return {success:false,error:"Cet espace contient déjà des données. La démonstration nécessite un espace vide."};
    return {success:false,error:"Le chargement de la démonstration n’a pas pu être confirmé. Actualise cet espace avant de réessayer."};
  }
  revalidateSpace(spaceId);
  return {success:true};
}

export async function clearAllUserData(spaceId:string):Promise<{success:boolean;error?:string}> {
  const {userId}=await requireSpace(spaceId);
  try {
    await sql.transaction(txn=>[
      ...maintenanceLocks(txn),
      txn`DELETE FROM notification_log WHERE space_id=${spaceId}`,
      txn`DELETE FROM expense_transactions WHERE space_id=${spaceId}`,
      txn`DELETE FROM debt_transactions WHERE space_id=${spaceId}`,
      txn`DELETE FROM savings_contributions WHERE space_id=${spaceId}`,
      txn`DELETE FROM monthly_allocations WHERE space_id=${spaceId}`,
      txn`DELETE FROM monthly_incomes WHERE space_id=${spaceId}`,
      txn`DELETE FROM monthly_expenses WHERE space_id=${spaceId}`,
      txn`DELETE FROM allocation_sections WHERE space_id=${spaceId}`,
      txn`DELETE FROM income_allocations WHERE space_id=${spaceId}`,
      txn`DELETE FROM expenses WHERE space_id=${spaceId}`,
      txn`DELETE FROM incomes WHERE space_id=${spaceId}`,
      txn`DELETE FROM debts WHERE space_id=${spaceId}`,
      txn`DELETE FROM cards WHERE space_id=${spaceId}`,
      txn`DELETE FROM sections WHERE space_id=${spaceId}`,
      txn`INSERT INTO sections(space_id,user_id,name,icon,color,position)
        SELECT ${spaceId},${userId},name,icon,color,position FROM jsonb_to_recordset(${JSON.stringify(DEFAULT_SECTIONS)}::jsonb)
        AS d(name text,icon text,color text,position integer)`,
      txn`INSERT INTO space_setup_guide(space_id,reset_at) VALUES(${spaceId},now())
        ON CONFLICT(space_id) DO UPDATE SET reset_at=now(),completed_at=NULL,dismissed_at=NULL`,
    ]);
  }catch{
    return {success:false,error:"La remise à zéro n’a pas pu être confirmée. Actualise cet espace avant de réessayer."};
  }
  revalidateSpace(spaceId);
  return {success:true};
}
