import { beforeAll, afterAll, describe, test, expect, vi } from "vitest";
import { randomUUID, randomBytes } from "node:crypto";
import type { DatabaseSql } from "@/lib/database/types";
import { createLocalDatabase } from "@/lib/database/local";
import { localConnection } from "../../scripts/financial-spaces/local-fixture.mjs";
import { runMigrations } from "../../scripts/financial-spaces/migrate.mjs";

type Identity = { id: string; name: string; email: string };
const state = vi.hoisted(() => ({ identity: null as Identity | null, sql: null as DatabaseSql | null }));
vi.mock("@/lib/auth/server", () => ({ auth: { getSession: async () => ({ data: state.identity ? { user: { ...state.identity } } : null }) } }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({
  sql: Object.assign((strings: TemplateStringsArray, ...values: unknown[]) => state.sql!(strings, ...values), {
    transaction: (...args: Parameters<DatabaseSql["transaction"]>) => state.sql!.transaction(...args),
  }),
}));

import { createSpace, getSpaces, getLastSpace, renameSpace, rememberSpace, getSpaceMembers } from "@/lib/actions/spaces";
import { requireSpace } from "@/lib/spaces/context";

const database = "spaces_migration_test_" + randomBytes(4).toString("hex");
const identities = {
  a: { id: "fixture-services-a", name: "Alice Fixture", email: "alice@example.test" },
  b: { id: "fixture-services-b", name: "Bob Fixture", email: "bob@example.test" },
  c: { id: "fixture-services-c", name: "Camille Fixture", email: "camille@example.test" },
};
let native: Awaited<ReturnType<typeof localConnection>>;
let adapter: ReturnType<typeof createLocalDatabase>;
let identifier: string;
let spaceA: string, spaceB: string;
const keyA = randomUUID();
const connectionString = `postgresql://budget_test:local-fixture-only@127.0.0.1:55437/${database}`;

async function count(table: string, space: string) {
  return Number((await native.query(`SELECT count(*) AS count FROM "${table}" WHERE space_id=$1`, [space])).rows[0].count);
}

describe("space services and local SQL — real PostgreSQL, server session stubbed", () => {
  beforeAll(async () => {
    const admin = await localConnection();
    try { await admin.query(`CREATE DATABASE "${database}" TEMPLATE spaces_baseline17`); }
    finally { await admin.end(); }
    native = await localConnection(database);
    await runMigrations(native, { through: "005", dryRun: false, allowCutover: true });
    identifier = (await native.query("SELECT system_identifier::text FROM pg_control_system()")).rows[0].system_identifier;
    adapter = createLocalDatabase(connectionString, identifier);
    state.sql = adapter.sql;
  });
  afterAll(async () => {
    if (adapter) await adapter.close();
    if (native) await native.end();
    const admin = await localConnection();
    try { await admin.query(`DROP DATABASE "${database}"`); }
    finally { await admin.end(); }
  });

  test("local adapter rejects remote targets and production mode before connecting", () => {
    expect(() => createLocalDatabase("postgresql://budget_test:local-fixture-only@example.invalid:55437/spaces_work17", identifier)).toThrow(/verified project fixture/);
    for (const suffix of ["?host=example.invalid", "?port=5432&user=other", "?dbname=other", "#fragment"]) {
      expect(() => createLocalDatabase(connectionString + suffix, identifier)).toThrow(/verified project fixture/);
    }
    vi.stubEnv("NODE_ENV", "production");
    try { expect(() => createLocalDatabase(connectionString, identifier)).toThrow(/verified project fixture/); }
    finally { vi.unstubAllEnvs(); }
  });

  test("a wrong cluster identifier blocks a write", async () => {
    const wrong = createLocalDatabase(connectionString, "0");
    const id = randomUUID();
    try {
      await expect(wrong.sql`INSERT INTO financial_spaces(id,name,created_by,creation_key,creation_fingerprint)
        VALUES(${id},'Forbidden cluster write','fixture-services-a',${randomUUID()},'fixture')`).rejects.toThrow(/Unexpected local database cluster/);
      expect((await native.query("SELECT 1 FROM financial_spaces WHERE id=$1", [id])).rowCount).toBe(0);
    } finally { await wrong.close(); }
  });

  test("tagged values remain parameters and use the Neon type parsers", async () => {
    const text = "L’été d’Alice'; SELECT 'another statement";
    const rows = await adapter.sql`SELECT ${text}::text AS value, '2026-10-23'::date AS day, '3.99'::numeric AS amount`;
    expect(rows[0].value).toBe(text);
    expect(rows[0].day).toBeInstanceOf(Date);
    expect(rows[0].amount).toBe("3.99");
  });

  test("unauthenticated operations cannot read or create an owned space", async () => {
    state.identity = null;
    await expect(getSpaces()).rejects.toThrow(/Connecte-toi/);
    expect(await createSpace({ name: "Unauthenticated", creationKey: randomUUID() })).toMatchObject({ ok: false });
    expect((await native.query("SELECT 1 FROM financial_spaces WHERE name='Unauthenticated'")).rowCount).toBe(0);
  });

  test("an account without membership is not automatically given a personal space", async () => {
    state.identity = identities.a;
    expect(await getSpaces()).toEqual([]);
    expect(await getLastSpace()).toBeNull();
    expect((await native.query("SELECT 1 FROM financial_spaces WHERE created_by=$1", [identities.a.id])).rowCount).toBe(0);
  });

  test("invalid names and request keys cause no partial provisioning", async () => {
    for (const name of ["   ", "a".repeat(81), "A\u0000B"]) {
      expect(await createSpace({ name, creationKey: randomUUID() })).toMatchObject({ ok: false });
    }
    expect(await createSpace({ name: "Valid", creationKey: "invalid" })).toMatchObject({ ok: false });
    expect((await native.query("SELECT 1 FROM financial_spaces WHERE created_by=$1", [identities.a.id])).rowCount).toBe(0);
  });

  test("creation provisions membership, defaults, guide and profile atomically", async () => {
    const result = await createSpace({ name: "  Nos finances  ", creationKey: keyA });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    spaceA = result.data.id;
    expect(result.data).toMatchObject({ name: "Nos finances", memberCount: 1 });
    expect(await count("space_memberships", spaceA)).toBe(1);
    expect(await count("space_settings", spaceA)).toBe(1);
    expect(await count("space_setup_guide", spaceA)).toBe(1);
    expect(await count("sections", spaceA)).toBe(6);
    expect((await native.query("SELECT last_space_id FROM user_space_preferences WHERE user_id=$1", [identities.a.id])).rows[0].last_space_id).toBe(spaceA);
    expect(await getSpaceMembers(spaceA)).toMatchObject([{ userId: identities.a.id, name: identities.a.name, email: identities.a.email, isCurrentUser: true }]);
  });

  test("four concurrent same-key creations return one space and six categories", async () => {
    const results = await Promise.all(Array.from({ length: 4 }, () => createSpace({ name: "Nos finances", creationKey: keyA })));
    expect(results.every(result => result.ok && result.data.id === spaceA)).toBe(true);
    expect(await count("sections", spaceA)).toBe(6);
    expect(await count("space_memberships", spaceA)).toBe(1);
    const freshKey = randomUUID();
    const fresh = await Promise.all(Array.from({ length: 4 }, () => createSpace({ name: "Concurrent new space", creationKey: freshKey })));
    const ids = fresh.flatMap(result => result.ok ? [result.data.id] : []);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(1);
    expect(await count("sections", ids[0])).toBe(6);
  });

  test("reusing a creation key with a different payload does not change an existing space", async () => {
    expect(await createSpace({ name: "Other request", creationKey: keyA })).toMatchObject({ ok: false });
    expect((await native.query("SELECT name FROM financial_spaces WHERE id=$1", [spaceA])).rows[0].name).toBe("Nos finances");
    expect(await count("sections", spaceA)).toBe(6);
  });

  test("a second account sees only its spaces and cannot access or remember the first", async () => {
    state.identity = identities.b;
    const result = await createSpace({ name: "Bob personnel", creationKey: randomUUID() });
    if (!result.ok) throw new Error(result.error);
    spaceB = result.data.id;
    expect((await getSpaces()).map(space => space.id)).toEqual([spaceB]);
    await expect(requireSpace(spaceA)).rejects.toThrow(/inaccessible/);
    await expect(getSpaceMembers(spaceA)).rejects.toThrow(/inaccessible/);
    expect(await renameSpace(spaceA, "Forbidden rename")).toMatchObject({ ok: false });
    expect(await rememberSpace(spaceA)).toMatchObject({ ok: false });
    expect((await getLastSpace())?.id).toBe(spaceB);
    await expect(requireSpace(randomUUID())).rejects.toThrow(/inaccessible/);
    await expect(requireSpace("not-a-uuid")).rejects.toThrow(/inaccessible/);
  });

  test("a member added to a shared space has the same rename and membership visibility rights", async () => {
    await native.query("INSERT INTO space_memberships(space_id,user_id) VALUES($1,$2)", [spaceA, identities.b.id]);
    expect(await renameSpace(spaceA, "Notre couple")).toMatchObject({ ok: true });
    const spaces = await getSpaces();
    expect(spaces.find(space => space.id === spaceA)?.memberCount).toBe(2);
    const members = await getSpaceMembers(spaceA);
    expect(members).toHaveLength(2);
    expect(members.find(member => member.userId === identities.b.id)?.isCurrentUser).toBe(true);
    expect((await native.query("SELECT created_by FROM financial_spaces WHERE id=$1", [spaceA])).rows[0].created_by).toBe(identities.a.id);
  });

  test("renaming a different managed space does not switch the current preference", async () => {
    state.identity = identities.a;
    await native.query("INSERT INTO space_memberships(space_id,user_id) VALUES($1,$2)", [spaceB, identities.a.id]);
    await rememberSpace(spaceA);
    expect(await renameSpace(spaceB, "Autre espace renommé")).toMatchObject({ ok: true });
    expect((await getLastSpace())?.id).toBe(spaceA);
    await rememberSpace(spaceB);
    expect((await getLastSpace())?.id).toBe(spaceB);
    expect((await requireSpace(spaceA)).spaceId).toBe(spaceA);
    expect(await renameSpace(spaceA, "Toujours le premier onglet")).toMatchObject({ ok: true });
    expect((await native.query("SELECT name FROM financial_spaces WHERE id=$1", [spaceB])).rows[0].name).toBe("Autre espace renommé");
    const replay = await createSpace({ name: "Nos finances", creationKey: keyA });
    expect(replay).toMatchObject({ ok: true, data: { id: spaceA, name: "Toujours le premier onglet", memberCount: 2 } });
    expect((await getLastSpace())?.id).toBe(spaceB);
    await native.query("UPDATE user_space_preferences SET last_space_id=NULL WHERE user_id=$1", [identities.a.id]);
    expect((await getSpaces()).length).toBeGreaterThan(1);
    expect(await getLastSpace()).toBeNull();
    await rememberSpace(spaceB);
  });

  test("SQL transaction callback commits together and rolls back earlier writes on failure", async () => {
    const section = randomUUID();
    await expect(adapter.sql.transaction(tx => [
      tx`INSERT INTO sections(id,space_id,user_id,name,position) VALUES(${section},${spaceA},${identities.a.id},'Rolled back category',9)`,
      tx`INSERT INTO cards(space_id,user_id,name) VALUES(${spaceA},${identities.a.id},${null})`,
    ])).rejects.toMatchObject({ code: "23502" });
    expect((await native.query("SELECT 1 FROM sections WHERE id=$1", [section])).rowCount).toBe(0);
    const result = await adapter.sql.transaction(tx => [tx`SELECT ${3.99}::numeric AS amount`,tx`SELECT ${1450}::numeric AS amount`]);
    expect(result.map(rows => rows[0].amount)).toEqual(["3.99", "1450"]);
  });

  test("a newly joined account can have only the common space", async () => {
    state.identity = identities.c;
    expect(await getSpaces()).toEqual([]);
    expect(await getLastSpace()).toBeNull();
    await native.query("INSERT INTO space_memberships(space_id,user_id) VALUES($1,$2)", [spaceA, identities.c.id]);
    expect((await getSpaces()).map(space => space.id)).toEqual([spaceA]);
    expect((await getLastSpace())?.id).toBe(spaceA);
    expect(await renameSpace(spaceA, "Espace commun")).toMatchObject({ ok: true });
    expect((await native.query("SELECT 1 FROM financial_spaces WHERE created_by=$1", [identities.c.id])).rowCount).toBe(0);
  });

  test("non-ready rollout prevents reads and creation without pretending the account is empty", async () => {
    await native.query("UPDATE financial_space_rollout SET phase='backfilled'");
    try {
      await expect(getSpaces()).rejects.toThrow(/préparation/);
      await expect(getLastSpace()).rejects.toThrow(/préparation/);
      expect(await createSpace({ name: "Not ready", creationKey: randomUUID() })).toMatchObject({ ok: false });
      expect((await native.query("SELECT 1 FROM financial_spaces WHERE name='Not ready'")).rowCount).toBe(0);
    } finally { await native.query("UPDATE financial_space_rollout SET phase='ready'"); }
  });
});
