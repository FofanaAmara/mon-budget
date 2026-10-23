import { Pool } from "pg";
import { types as neonTypes, NeonQueryPromise, type ParameterizedQuery } from "@neondatabase/serverless";
import type { DatabaseRows, DatabaseSql } from "./types";

/** Local recipe adapter. Refuses remote URLs and verifies the PostgreSQL cluster. */
export function createLocalDatabase(connectionString: string, systemIdentifier: string) {
  const url = new URL(connectionString);
  if (process.env.NODE_ENV === "production" || url.protocol !== "postgresql:"
    || url.hostname !== "127.0.0.1" || url.port !== "55437"
    || decodeURIComponent(url.username) !== "budget_test"
    || decodeURIComponent(url.password) !== "local-fixture-only" || url.search || url.hash
    || !/^\/(spaces_work17|spaces_migration_test_[a-f0-9]{8})$/.test(url.pathname)
    || !/^\d+$/.test(systemIdentifier)) {
    throw new Error("Local database mode requires the verified project fixture.");
  }
  // Do not pass a raw URL: pg's URI query parameters can override its authority.
  const pool = new Pool({ host: "127.0.0.1", port: 55437, user: "budget_test", password: "local-fixture-only",
    database: url.pathname.slice(1), max: 5, types: neonTypes });

  async function connection() {
    const client = await pool.connect();
    try {
      const identity = await client.query("SELECT system_identifier::text FROM pg_control_system()");
      if (identity.rows[0]?.system_identifier !== systemIdentifier) throw new Error("Unexpected local database cluster.");
      return client;
    } catch (error) { client.release(); throw error; }
  }

  function parameterize(strings: TemplateStringsArray, values: unknown[]): ParameterizedQuery {
    return { query: strings.reduce((query, part, index) => query + (index ? "$" + index : "") + part, ""), params: values };
  }

  const sql: DatabaseSql = (strings, ...values) => new NeonQueryPromise<false, false, DatabaseRows>(async data => {
    if (Array.isArray(data) || !("query" in data)) throw new Error("Expected a parameterized query.");
    const client = await connection();
    try { return (await client.query(data.query, data.params)).rows; }
    finally { client.release(); }
  }, parameterize(strings, values));

  sql.transaction = async callback => {
    const owned = new WeakSet();
    const queries = callback((strings, ...values) => {
      const query = { queryData: parameterize(strings, values) };
      owned.add(query);
      return query;
    });
    if (!Array.isArray(queries) || queries.some(query => !owned.has(query))) {
      throw new Error("Transaction requires queries from its own tagged SQL builder.");
    }
    const client = await connection();
    try {
      await client.query("BEGIN");
      const results = [];
      for (const { queryData } of queries) {
        if (!("query" in queryData)) throw new Error("Expected a parameterized transaction query.");
        results.push((await client.query(queryData.query, queryData.params)).rows);
      }
      await client.query("COMMIT");
      return results;
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    finally { client.release(); }
  };

  return { sql, close: () => pool.end() };
}
