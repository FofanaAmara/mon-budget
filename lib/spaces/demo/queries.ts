import { randomUUID } from "node:crypto";
import type { DatabaseTransactionTag } from "@/lib/database/types";
import example from "./data.json";
import { demoColumns } from "./columns";

/** IDs and all foreign references are regenerated for every target space. */
export function demoInsertQueries(txn: DatabaseTransactionTag, spaceId: string, userId: string) {
  const identifiers = new Map<string,string>();
  for (const rows of Object.values(example)) for (const row of rows) identifiers.set(row.id,randomUUID());
  return (Object.keys(demoColumns) as (keyof typeof demoColumns)[]).map(table => {
    const rows = example[table].map(row => Object.fromEntries(Object.entries(row).map(([key,value]) =>
      [key,typeof value === "string" ? identifiers.get(value) ?? value : value])));
    const columns = demoColumns[table].join(",");
    const selections = demoColumns[table].map(column=>`r.${column}`).join(",");
    // Table and column identifiers come only from the checked-in allowlist above.
    const pieces = Object.assign([
      `INSERT INTO ${table} (space_id,user_id,${columns}) SELECT `,
      ",",`,${selections} FROM jsonb_populate_recordset(NULL::${table},`,"::jsonb) r",
    ],{raw:[] as string[]}) as unknown as TemplateStringsArray;
    return txn(pieces,spaceId,userId,JSON.stringify(rows));
  });
}
