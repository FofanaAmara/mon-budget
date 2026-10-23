import { beforeAll, beforeEach, afterAll, describe, test, expect, vi } from "vitest";
import { randomUUID, randomBytes } from "node:crypto";
import type { DatabaseSql } from "@/lib/database/types";
import { createLocalDatabase } from "@/lib/database/local";
import { localConnection, testBaseline } from "../../scripts/financial-spaces/local-fixture.mjs";
import { runMigrations } from "../../scripts/financial-spaces/migrate.mjs";

const state = vi.hoisted(() => ({ userId: "fixture-maintenance-a" as string | null, sql: null as DatabaseSql | null }));
vi.mock("@/lib/auth/server", () => {
  const getSession = async () => ({ data: state.userId ? { user: { id: state.userId } } : null });
  return { auth: { getSession }, authSessionReader: { getSession } };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ sql: Object.assign((strings: TemplateStringsArray, ...values: unknown[]) => state.sql!(strings, ...values), {
  transaction: (...args: Parameters<DatabaseSql["transaction"]>) => state.sql!.transaction(...args),
}) }));

import * as maintenance from "@/lib/actions/financial/demo-data";
import { ensureDefaultSections } from "@/lib/actions/financial/claim";
import { createSpace } from "@/lib/actions/spaces";
import { createCard } from "@/lib/actions/financial/cards";
import { updateAccountSettings } from "@/lib/actions/account-settings";
import { setTimeout as delay } from "node:timers/promises";

const database = "spaces_migration_test_" + randomBytes(4).toString("hex");
let native: Awaited<ReturnType<typeof localConnection>>;
let adapter: ReturnType<typeof createLocalDatabase>;
let common: string, personal: string;
const a = "fixture-maintenance-a", b = "fixture-maintenance-b", outsider = "fixture-maintenance-outsider";
async function space(name: string) {
  const result = await createSpace({ expectedActorId: state.userId || "signed-out", name, creationKey: randomUUID() });
  if (!result.ok) throw new Error(result.error);
  return result.data.id;
}

const tables=["sections","cards","incomes","expenses","debts","savings_contributions","debt_transactions","monthly_expenses","monthly_incomes","income_allocations","monthly_allocations","allocation_sections","expense_transactions","notification_log"];
async function snapshot(spaceId:string) {
  const result:Record<string,unknown[]>={};
  for(const table of tables)result[table]=(await native.query(`SELECT * FROM ${table} WHERE space_id=$1 ORDER BY 1,2`,[spaceId])).rows;
  return result;
}
async function waitForLock(fragment:string) {
  const deadline=Date.now()+3000;
  while(Date.now()<deadline){
    await native.query("SELECT pg_stat_clear_snapshot()");
    if((await native.query("SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE $1",["%"+fragment+"%"])).rowCount)return;
    await delay(10);
  }
  throw new Error("Expected application query waiting on maintenance lock.");
}

describe("space maintenance — transactional reset and preserved demo dataset",()=>{
  beforeEach(() => { state.userId = a; });
  beforeAll(async () => {
    const admin = await localConnection();
    try { await admin.query(`CREATE DATABASE "${database}" TEMPLATE "${testBaseline()}"`); } finally { await admin.end(); }
    native = await localConnection(database);
    await runMigrations(native, { through: "006", dryRun: false, allowCutover: true });
    const identifier = (await native.query("SELECT system_identifier::text FROM pg_control_system()")).rows[0].system_identifier;
    adapter = createLocalDatabase(`postgresql://budget_test:local-fixture-only@127.0.0.1:55437/${database}`, identifier);
    state.sql = adapter.sql;
    common = await space("Commun"); personal = await space("Privé");
    await native.query("INSERT INTO space_memberships(space_id,user_id) VALUES($1,$2)", [common,b]);
  });
  afterAll(async () => {
    if (adapter) await adapter.close();
    if (native) await native.end();
    const admin = await localConnection();
    try { await admin.query(`DROP DATABASE "${database}"`); } finally { await admin.end(); }
  });


  test("co-member loads every existing synthetic example into only the explicit space",async()=>{
    const other=await snapshot(personal);
    state.userId=b;
    expect(await maintenance.loadDemoData(common)).toEqual({success:true});
    expect(await maintenance.hasUserData(common)).toBe(true);
    const data=await snapshot(common);
    expect(Object.fromEntries(Object.entries(data).slice(0,11).map(([table,rows])=>[table,rows.length]))).toEqual({sections:6,cards:2,incomes:2,expenses:18,debts:2,savings_contributions:15,debt_transactions:18,monthly_expenses:16,monthly_incomes:5,income_allocations:11,monthly_allocations:21});
    expect(data.expenses.every(row=>(row as {user_id:string}).user_id===b)).toBe(true);
    expect((await native.query("SELECT count(*) FROM expenses WHERE space_id=$1 AND system_kind='FREE_SAVINGS'",[common])).rows[0].count).toBe("1");
    expect((await native.query("SELECT amount FROM expenses WHERE space_id=$1 AND name='iCloud+'",[common])).rows[0].amount).toBe("3.99");
    expect((await native.query("SELECT amount FROM expenses WHERE space_id=$1 AND name='Loyer'",[common])).rows[0].amount).toBe("1450.00");
    expect((await native.query("SELECT debt_paid_amount FROM monthly_expenses WHERE space_id=$1 AND debt_id IS NOT NULL AND status='PAID' ORDER BY amount",[common])).rows.map(row=>row.debt_paid_amount)).toEqual(["150.00","400.00"]);
    state.userId=a;expect(await snapshot(personal)).toEqual(other);
  });

  test("non-empty space refusal is atomic and does not replace anything",async()=>{
    const before=await snapshot(common);
    const result=await maintenance.loadDemoData(common);
    expect(result.success).toBe(false);expect(result.error).toMatch(/contient déjà/);
    expect(await snapshot(common)).toEqual(before);
  });

  test("two simultaneous demo requests produce only one complete set",async()=>{
    const id=await space("Démo concurrente");
    const results=await Promise.all([maintenance.loadDemoData(id),maintenance.loadDemoData(id)]);
    expect(results.map(result=>result.success).sort()).toEqual([false,true]);
    expect((await native.query("SELECT count(*) FROM expenses WHERE space_id=$1",[id])).rows[0].count).toBe("18");
  });

  test("late demo failure restores the previous sections and every partial insertion",async()=>{
    const id=await space("Démo en échec");const before=await snapshot(id);
    await native.query(`CREATE FUNCTION fixture_fail_demo() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.space_id='${id}'::uuid THEN RAISE EXCEPTION 'fixture rollback'; END IF; RETURN NEW; END $$`);
    await native.query("CREATE TRIGGER fixture_fail_demo BEFORE INSERT ON debt_transactions FOR EACH ROW EXECUTE FUNCTION fixture_fail_demo()");
    try{expect((await maintenance.loadDemoData(id)).success).toBe(false);expect(await snapshot(id)).toEqual(before);}
    finally{await native.query("DROP TRIGGER fixture_fail_demo ON debt_transactions");await native.query("DROP FUNCTION fixture_fail_demo()");}
  });

  test("an ordinary writer completing before the maintenance lock makes demo refuse safely",async()=>{
    const id=await space("Écriture concurrente");
    await native.query("BEGIN");await native.query("LOCK TABLE cards IN ROW EXCLUSIVE MODE");
    const pending=maintenance.loadDemoData(id);
    try{
      await waitForLock("LOCK TABLE sections");
      await native.query("INSERT INTO cards(space_id,user_id,name) VALUES($1,$2,'Carte arrivée pendant la demande')",[id,a]);
      await native.query("COMMIT");
      expect((await pending).success).toBe(false);
      expect((await native.query("SELECT name FROM cards WHERE space_id=$1",[id])).rows).toEqual([{name:"Carte arrivée pendant la demande"}]);
      expect((await native.query("SELECT count(*) FROM expenses WHERE space_id=$1",[id])).rows[0].count).toBe("0");
    }finally{await native.query("ROLLBACK");await pending.catch(()=>undefined);}
  });

  test("reset removes both members' shared contributions but preserves other space, identity preferences and devices",async()=>{
    const otherCard=await createCard(personal,{name:"Carte conservée"});
    await createCard(common,{name:"Contribution de A"});
    await updateAccountSettings({email:"private@example.test",notify_push:false});
    await native.query("INSERT INTO user_onboarding(user_id,has_seen_onboarding) VALUES($1,true)",[a]);
    await native.query("INSERT INTO push_subscriptions(user_id,endpoint,p256dh,auth) VALUES($1,'https://fixture.example.test/device','fixture-key','fixture-auth')",[a]);
    const other=await snapshot(personal);
    const prefs=(await native.query("SELECT * FROM settings WHERE user_id=$1",[a])).rows;
    const membership=(await native.query("SELECT * FROM space_memberships WHERE space_id=$1 ORDER BY user_id",[common])).rows;
    await native.query("UPDATE space_settings SET default_currency='EUR',default_reminder_offsets=ARRAY[2,8] WHERE space_id=$1",[common]);
    state.userId=b;
    expect(await maintenance.clearAllUserData(common)).toEqual({success:true});
    expect(await maintenance.hasUserData(common)).toBe(false);
    const empty=await snapshot(common);
    expect(empty.sections).toHaveLength(6);
    expect(Object.entries(empty).filter(([name])=>name!=="sections").every(([,rows])=>rows.length===0)).toBe(true);
    expect((await native.query("SELECT default_currency,default_reminder_offsets FROM space_settings WHERE space_id=$1",[common])).rows[0]).toEqual({default_currency:"EUR",default_reminder_offsets:[2,8]});
    expect(await snapshot(personal)).toEqual(other);
    expect((await native.query("SELECT id FROM cards WHERE id=$1",[otherCard.id])).rowCount).toBe(1);
    expect((await native.query("SELECT * FROM settings WHERE user_id=$1",[a])).rows).toEqual(prefs);
    expect((await native.query("SELECT has_seen_onboarding FROM user_onboarding WHERE user_id=$1",[a])).rows[0].has_seen_onboarding).toBe(true);
    expect((await native.query("SELECT count(*) FROM push_subscriptions WHERE user_id=$1",[a])).rows[0].count).toBe("1");
    expect((await native.query("SELECT * FROM space_memberships WHERE space_id=$1 ORDER BY user_id",[common])).rows).toEqual(membership);
  });

  test("late reset failure restores finances, links, journals, sections and guide",async()=>{
    const id=await space("Reset en échec");expect((await maintenance.loadDemoData(id)).success).toBe(true);
    const before=await snapshot(id),guide=(await native.query("SELECT * FROM space_setup_guide WHERE space_id=$1",[id])).rows;
    await native.query(`CREATE FUNCTION fixture_fail_reset() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF OLD.space_id='${id}'::uuid THEN RAISE EXCEPTION 'fixture rollback'; END IF; RETURN OLD; END $$`);
    await native.query("CREATE TRIGGER fixture_fail_reset BEFORE DELETE ON cards FOR EACH ROW EXECUTE FUNCTION fixture_fail_reset()");
    try{expect((await maintenance.clearAllUserData(id)).success).toBe(false);expect(await snapshot(id)).toEqual(before);expect((await native.query("SELECT * FROM space_setup_guide WHERE space_id=$1",[id])).rows).toEqual(guide);}
    finally{await native.query("DROP TRIGGER fixture_fail_reset ON cards");await native.query("DROP FUNCTION fixture_fail_reset()");}
  });

  test("default section provisioning is concurrent, scoped and leaves custom sections alone",async()=>{
    const id=await space("Catégories absentes");await native.query("DELETE FROM sections WHERE space_id=$1",[id]);
    await Promise.all(Array.from({length:4},()=>ensureDefaultSections(id)));
    expect((await native.query("SELECT count(*) FROM sections WHERE space_id=$1",[id])).rows[0].count).toBe("6");
    await native.query("UPDATE sections SET name='Personnalisée' WHERE space_id=$1",[id]);
    await ensureDefaultSections(id);
    expect((await native.query("SELECT DISTINCT name FROM sections WHERE space_id=$1",[id])).rows).toEqual([{name:"Personnalisée"}]);
  });

  test("no maintenance entry accepts a non-member, another member's personal space, or missing identity",async()=>{
    for(const userId of [outsider,null,b]){
      state.userId=userId;
      const target=userId===b?personal:common;
      for(const action of [()=>maintenance.hasUserData(target),()=>maintenance.loadDemoData(target),()=>maintenance.clearAllUserData(target),()=>ensureDefaultSections(target)])await expect(action()).rejects.toThrow();
    }
  });

  test("reset and default provisioning overlap without a parent/FK lock cycle",async()=>{
    const id=await space("Reset et provisioning simultanés");
    const gate=118883;
    await native.query(`CREATE FUNCTION fixture_pause_sections() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF OLD.space_id='${id}'::uuid THEN PERFORM pg_advisory_xact_lock(${gate}); END IF; RETURN OLD; END $$`);
    await native.query("CREATE TRIGGER fixture_pause_sections BEFORE DELETE ON sections FOR EACH ROW EXECUTE FUNCTION fixture_pause_sections()");
    await native.query("SELECT pg_advisory_lock($1)",[gate]);
    const resetting=maintenance.clearAllUserData(id);
    let provisioning:Promise<void>|undefined;
    try{
      await waitForLock("DELETE FROM sections");
      provisioning=ensureDefaultSections(id);
      await waitForLock("INSERT INTO sections");
      await native.query("SELECT pg_advisory_unlock($1)",[gate]);
      expect(await resetting).toEqual({success:true});
      await expect(provisioning).resolves.toBeUndefined();
      expect((await native.query("SELECT count(*) FROM sections WHERE space_id=$1",[id])).rows[0].count).toBe("6");
    }finally{
      await native.query("SELECT pg_advisory_unlock($1)",[gate]);
      await Promise.allSettled([resetting,...(provisioning?[provisioning]:[])]);
      await native.query("DROP TRIGGER fixture_pause_sections ON sections");
      await native.query("DROP FUNCTION fixture_pause_sections()");
    }
  });
});
