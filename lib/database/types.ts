import type { QueryResultRow } from "pg";
import type { NeonQueryPromise, NeonQueryInTransaction } from "@neondatabase/serverless";

export type DatabaseRows = QueryResultRow[];
export type DatabaseQuery = NeonQueryPromise<false, false, DatabaseRows>;
export type DatabaseTag = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => DatabaseQuery;

/** The SQL surface used by the app, shared by Neon HTTP and local PostgreSQL. */
export type DatabaseSql = DatabaseTag & {
  transaction: (queries: (transaction: (
    strings: TemplateStringsArray, ...values: unknown[]
  ) => NeonQueryInTransaction) => NeonQueryInTransaction[]) => Promise<DatabaseRows[]>;
};
