"use server";

import { sql } from "@/lib/db";
import { requireSpace,SpaceAccessError } from "@/lib/spaces/context";
import { requireFinancialParents,requireFinancialRecord,revalidateSpace } from "@/lib/spaces/financial";
import type { IncomeAllocation,MonthlyAllocation,AllocationSection } from "@/lib/types";
import { validateInput } from "@/lib/schemas/validate";
import { idSchema,monthSchema,orderedIdsSchema } from "@/lib/schemas/common";
import { CreateAllocationSchema,type CreateAllocationInput,CreateAdhocAllocationSchema,UpdateMonthlyAllocationSchema } from "@/lib/schemas/allocation";

async function allocationParents(spaceId:string,data:{section_ids?:string[];project_id?:string|null}) {
  await requireFinancialParents(spaceId,{project_id:data.project_id});
  const ids=data.section_ids??[];
  if(new Set(ids).size!==ids.length) throw new Error("Les catégories doivent être distinctes.");
  if(ids.length) {
    const [row]=await sql`SELECT count(*) AS count FROM sections WHERE space_id=${spaceId} AND id=ANY(${ids}::uuid[])`;
    if(Number(row.count)!==ids.length) throw new SpaceAccessError("Une catégorie est inaccessible dans cet espace.");
  }
}

async function fetchAllocationSections(spaceId:string,allocationIds:string[]):Promise<Map<string,AllocationSection[]>> {
  if(!allocationIds.length) return new Map();
  const rows=await sql`SELECT j.allocation_id,s.id,s.name,s.icon,s.color FROM allocation_sections j
    JOIN sections s ON s.id=j.section_id AND s.space_id=j.space_id
    WHERE j.space_id=${spaceId} AND j.allocation_id=ANY(${allocationIds}::uuid[]) ORDER BY s.name,s.id`;
  const map=new Map<string,AllocationSection[]>();
  for(const row of rows) {
    const list=map.get(row.allocation_id)??[];
    list.push({id:row.id,name:row.name,icon:row.icon,color:row.color});map.set(row.allocation_id,list);
  }
  return map;
}

export async function getAllocations(spaceId:string):Promise<IncomeAllocation[]> {
  await requireSpace(spaceId);
  const rows=await sql`SELECT a.*,e.name AS project_name,e.target_amount AS project_target_amount,
    e.saved_amount AS project_saved_amount,e.target_date AS project_target_date FROM income_allocations a
    LEFT JOIN expenses e ON e.id=a.project_id AND e.space_id=a.space_id
    WHERE a.space_id=${spaceId} AND a.is_active ORDER BY a.position,a.created_at,a.id`;
  const linked=await fetchAllocationSections(spaceId,rows.map(row=>row.id));
  return rows.map(row=>({...row,sections:linked.get(row.id)??[],section_ids:(linked.get(row.id)??[]).map(s=>s.id)})) as IncomeAllocation[];
}

export async function createAllocation(spaceId:string,data:CreateAllocationInput):Promise<IncomeAllocation> {
  data=validateInput(CreateAllocationSchema,data);
  const {userId}=await requireSpace(spaceId);await allocationParents(spaceId,data);
  const rows=await sql`WITH created AS (
    INSERT INTO income_allocations(space_id,user_id,label,amount,section_id,project_id,end_month,color,position)
    SELECT ${spaceId},${userId},${data.label},${data.amount},${data.section_ids?.[0]??null},${data.project_id??null},
      ${data.end_month??null},${data.color??'#6B6966'},COALESCE(${data.position??null},(SELECT COALESCE(MAX(position),-1)+1 FROM income_allocations WHERE space_id=${spaceId} AND is_active)) RETURNING *
  ), links AS (
    INSERT INTO allocation_sections(space_id,allocation_id,section_id)
    SELECT ${spaceId},c.id,s.id::uuid FROM created c CROSS JOIN jsonb_array_elements_text(${JSON.stringify(data.section_ids??[])}::jsonb) s(id)
  ) SELECT * FROM created`;
  const record=requireFinancialRecord(rows[0]);
  revalidateSpace(spaceId);
  return {...record,section_ids:data.section_ids??[],sections:(await fetchAllocationSections(spaceId,[record.id])).get(record.id)??[]} as IncomeAllocation;
}

export async function updateAllocation(spaceId:string,id:string,data:CreateAllocationInput):Promise<void> {
  validateInput(idSchema,id);data=validateInput(CreateAllocationSchema,data);
  await requireSpace(spaceId);await allocationParents(spaceId,data);
  const [rows]=await sql.transaction(txn=>[
    txn`UPDATE income_allocations SET label=${data.label},amount=${data.amount},section_id=${data.section_ids?.[0]??null},
      project_id=${data.project_id??null},end_month=${data.end_month??null},color=${data.color??'#6B6966'},updated_at=now()
      WHERE space_id=${spaceId} AND id=${id} AND is_active RETURNING id`,
    txn`DELETE FROM allocation_sections j WHERE j.space_id=${spaceId} AND j.allocation_id=${id}
      AND EXISTS(SELECT 1 FROM income_allocations a WHERE a.space_id=j.space_id AND a.id=j.allocation_id AND a.is_active)`,
    txn`INSERT INTO allocation_sections(space_id,allocation_id,section_id)
      SELECT ${spaceId},a.id,s.id::uuid FROM income_allocations a
      CROSS JOIN jsonb_array_elements_text(${JSON.stringify(data.section_ids??[])}::jsonb) s(id)
      WHERE a.space_id=${spaceId} AND a.id=${id} AND a.is_active`,
  ]);
  requireFinancialRecord(rows[0]);revalidateSpace(spaceId);
}

export async function deleteAllocation(spaceId:string,id:string):Promise<void> {
  validateInput(idSchema,id);await requireSpace(spaceId);
  const rows=await sql`UPDATE income_allocations SET is_active=false,updated_at=now() WHERE space_id=${spaceId} AND id=${id} RETURNING id`;
  requireFinancialRecord(rows[0]);revalidateSpace(spaceId);
}

export async function reorderAllocations(spaceId:string,orderedIds:string[]):Promise<void> {
  validateInput(orderedIdsSchema,orderedIds);await requireSpace(spaceId);
  if(new Set(orderedIds).size!==orderedIds.length) throw new Error("Les allocations doivent être distinctes.");
  const rows=await sql`WITH requested AS (
    SELECT id::uuid,(position-1)::integer AS position FROM jsonb_array_elements_text(${JSON.stringify(orderedIds)}::jsonb) WITH ORDINALITY r(id,position)
  ), locked AS MATERIALIZED (
    SELECT a.id FROM income_allocations a JOIN requested r ON r.id=a.id WHERE a.space_id=${spaceId} AND a.is_active ORDER BY a.id FOR NO KEY UPDATE OF a
  ), valid AS (SELECT count(*)=${orderedIds.length} AS ok FROM locked)
    UPDATE income_allocations a SET position=r.position,updated_at=now() FROM requested r,valid v
    WHERE v.ok AND a.id=r.id AND a.space_id=${spaceId} RETURNING a.id`;
  requireFinancialRecord(rows.length===orderedIds.length?rows[0]:undefined);revalidateSpace(spaceId);
}

export async function generateMonthlyAllocations(spaceId:string,month:string):Promise<void> {
  validateInput(monthSchema,month);const {userId}=await requireSpace(spaceId);
  await sql.transaction(txn=>[
    txn`SELECT id FROM expenses WHERE space_id=${spaceId} AND type='PLANNED' ORDER BY id FOR NO KEY UPDATE`,
    txn`WITH locked AS MATERIALIZED (
      SELECT * FROM income_allocations WHERE space_id=${spaceId} AND is_active ORDER BY id FOR NO KEY UPDATE
    ) INSERT INTO monthly_allocations(space_id,user_id,allocation_id,month,allocated_amount)
      SELECT ${spaceId},${userId},a.id,${month},a.amount FROM locked a
      LEFT JOIN expenses e ON e.id=a.project_id AND e.space_id=a.space_id
      WHERE (a.end_month IS NULL OR a.end_month>=${month})
        AND (a.project_id IS NULL OR e.target_amount IS NULL OR COALESCE(e.saved_amount,0)<e.target_amount)
      ON CONFLICT(allocation_id,month) DO NOTHING`,
  ]);
}

export async function getMonthlyAllocations(spaceId:string,month:string):Promise<MonthlyAllocation[]> {
  validateInput(monthSchema,month);await requireSpace(spaceId);
  const rows=await sql`SELECT m.*,a.label,a.color,a.position,a.project_id,a.end_month,
    e.name AS project_name,e.target_amount AS project_target_amount,e.saved_amount AS project_saved_amount,e.target_date AS project_target_date
    FROM monthly_allocations m JOIN income_allocations a ON a.id=m.allocation_id AND a.space_id=m.space_id
    LEFT JOIN expenses e ON e.id=a.project_id AND e.space_id=a.space_id
    WHERE m.space_id=${spaceId} AND m.month=${month} ORDER BY a.position,a.created_at,a.id`;
  const linked=await fetchAllocationSections(spaceId,rows.map(row=>row.allocation_id));
  return rows.map(row=>({...row,sections:linked.get(row.allocation_id)??[],section_ids:(linked.get(row.allocation_id)??[]).map(s=>s.id)})) as MonthlyAllocation[];
}

export async function createAdhocMonthlyAllocation(spaceId:string,month:string,data:{label:string;amount:number;section_ids?:string[];project_id?:string|null;color?:string}):Promise<void> {
  ({month,data}=validateInput(CreateAdhocAllocationSchema,{month,data}));
  const {userId}=await requireSpace(spaceId);await allocationParents(spaceId,data);
  await sql`WITH created AS (
    INSERT INTO income_allocations(space_id,user_id,label,amount,section_id,project_id,end_month,color,position,is_active)
    SELECT ${spaceId},${userId},${data.label},${data.amount},${data.section_ids?.[0]??null},${data.project_id??null},${month},${data.color??'#6B6966'},
      COALESCE((SELECT MAX(position)+1 FROM income_allocations WHERE space_id=${spaceId} AND is_active),0),false RETURNING id
  ), links AS (
    INSERT INTO allocation_sections(space_id,allocation_id,section_id) SELECT ${spaceId},c.id,s.id::uuid FROM created c
      CROSS JOIN jsonb_array_elements_text(${JSON.stringify(data.section_ids??[])}::jsonb) s(id)
  ) INSERT INTO monthly_allocations(space_id,user_id,allocation_id,month,allocated_amount)
    SELECT ${spaceId},${userId},id,${month},${data.amount} FROM created`;
  revalidateSpace(spaceId);
}

export async function updateMonthlyAllocation(spaceId:string,id:string,amount:number,notes?:string|null):Promise<void> {
  ({id,amount,notes}=validateInput(UpdateMonthlyAllocationSchema,{id,amount,notes}));
  await requireSpace(spaceId);
  const rows=await sql`UPDATE monthly_allocations SET allocated_amount=${amount},notes=${notes??null}
    WHERE space_id=${spaceId} AND id=${id} RETURNING id`;
  requireFinancialRecord(rows[0]);revalidateSpace(spaceId);
}
