import { beforeAll, beforeEach, afterAll, describe, test, expect, vi } from "vitest";
import { randomUUID, randomBytes } from "node:crypto";
import type { DatabaseSql } from "@/lib/database/types";
import { createLocalDatabase } from "@/lib/database/local";
import { localConnection, testBaseline } from "../../scripts/financial-spaces/local-fixture.mjs";
import { runMigrations } from "../../scripts/financial-spaces/migrate.mjs";

const state = vi.hoisted(() => ({ userId: "fixture-settings-a" as string | null, sql: null as DatabaseSql | null }));
vi.mock("@/lib/auth/server", () => {
  const getSession = async () => ({ data: state.userId ? { user: { id: state.userId } } : null });
  return { auth: { getSession }, authSessionReader: { getSession } };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ sql: Object.assign((strings: TemplateStringsArray, ...values: unknown[]) => state.sql!(strings, ...values), {
  transaction: (...args: Parameters<DatabaseSql["transaction"]>) => state.sql!.transaction(...args),
}) }));

import * as settings from "@/lib/actions/financial/settings";
import * as account from "@/lib/actions/account-settings";
import * as guide from "@/lib/actions/financial/setup-guide";
import { createSpace } from "@/lib/actions/spaces";
import { currentMonth } from "@/lib/utils";

const database = "spaces_migration_test_" + randomBytes(4).toString("hex");
let native: Awaited<ReturnType<typeof localConnection>>;
let adapter: ReturnType<typeof createLocalDatabase>;
let common: string, personal: string;
const a = "fixture-settings-a", b = "fixture-settings-b", outsider = "fixture-settings-outsider";
async function space(name: string) {
  const result = await createSpace({ expectedActorId: state.userId || "signed-out", name, creationKey: randomUUID() });
  if (!result.ok) throw new Error(result.error);
  return result.data.id;
}
async function timestamps(spaceId: string) {
  return (await native.query("SELECT completed_at,dismissed_at,reset_at FROM space_setup_guide WHERE space_id=$1", [spaceId])).rows[0];
}
async function finishedSpace(name: string) {
  const id = await space(name);
  await native.query("INSERT INTO incomes(space_id,user_id,name,amount,frequency) VALUES($1,$2,'Salaire',100,'MONTHLY')", [id,a]);
  const expense = (await native.query("INSERT INTO expenses(space_id,user_id,name,amount,type) VALUES($1,$2,'Charge',10,'ONE_TIME') RETURNING id", [id,a])).rows[0].id;
  await native.query("INSERT INTO monthly_expenses(space_id,user_id,expense_id,month,name,amount,status) VALUES($1,$2,$3,$4,'Charge',10,'PAID')", [id,a,expense,currentMonth()]);
  return id;
}

describe("space settings and guide — shared finances, individual account", () => {
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

  test("a co-member changes currency/reminders for both, never another space", async () => {
    const originalPersonal = await settings.getSettings(personal);
    state.userId = b;
    await settings.updateSettings(common,{default_currency:"EUR",default_reminder_offsets:[1,2,7]});
    state.userId = a;
    expect(await settings.getSettings(common)).toMatchObject({space_id:common,default_currency:"EUR",default_reminder_offsets:[1,2,7]});
    expect(await settings.getSettings(personal)).toEqual(originalPersonal);
    await settings.updateSettings(common,{default_reminder_offsets:[]});
    expect(await settings.getSettings(common)).toMatchObject({default_currency:"EUR",default_reminder_offsets:[]});
  });

  test("concurrent partial changes keep the other field", async () => {
    await Promise.all([settings.updateSettings(common,{default_currency:"USD"}),settings.updateSettings(common,{default_reminder_offsets:[1,9]})]);
    expect(await settings.getSettings(common)).toMatchObject({default_currency:"USD",default_reminder_offsets:[1,9]});
  });

  test("contact and notification preferences belong to the authenticated individual", async () => {
    await account.updateAccountSettings({email:"a@example.test",phone:"123",notify_push:false,notify_email:true});
    state.userId = b;
    expect(await account.getAccountSettings()).toMatchObject({email:null,phone:null,notify_push:true});
    await account.updateAccountSettings({email:"b@example.test",notify_sms:true});
    state.userId = a;
    expect(await account.getAccountSettings()).toMatchObject({email:"a@example.test",phone:"123",notify_push:false,notify_email:true,notify_sms:false});
    await account.updateAccountSettings({phone:null});
    expect(await account.getAccountSettings()).toMatchObject({email:"a@example.test",phone:null,notify_push:false});
    expect((await settings.getSettings(common)).default_currency).toBe("USD");
  });

  test("parallel first account reads provision only one preference record", async () => {
    state.userId = outsider;
    await Promise.all(Array.from({length:4},()=>account.getAccountSettings()));
    expect((await native.query("SELECT count(*) FROM settings WHERE user_id=$1",[outsider])).rows[0].count).toBe("1");
    state.userId = a;
  });

  test("settings boundaries reject fields from the other domain and invalid arrays", async () => {
    await expect(settings.updateSettings(common,{notify_push:false} as never)).rejects.toThrow();
    await expect(account.updateAccountSettings({default_currency:"GBP"} as never)).rejects.toThrow();
    await expect(account.updateAccountSettings({user_id:b} as never)).rejects.toThrow();
    await expect(settings.updateSettings(common,{default_reminder_offsets:[-1]})).rejects.toThrow();
    for (const currency of ["invalide", "A", "123", "$", "GBP"]) {
      await expect(settings.updateSettings(common,{default_currency:currency} as never)).rejects.toThrow();
    }
  });

  test("every guide and financial-setting entry refuses a non-member or missing session", async () => {
    for (const userId of [outsider,null]) {
      state.userId = userId;
      for (const action of [()=>settings.getSettings(common),()=>settings.updateSettings(common,{default_currency:"CAD"}),
        ()=>guide.getOrInitSetupGuideData(common),()=>guide.completeSetupGuide(common),()=>guide.dismissSetupGuide(common),()=>guide.resetSetupGuide(common)]) {
        await expect(action()).rejects.toThrow();
      }
    }
    await expect(account.getAccountSettings()).rejects.toThrow();
    await expect(account.updateAccountSettings({email:null})).rejects.toThrow();
    state.userId = b;
    await expect(settings.getSettings(personal)).rejects.toThrow();
    await expect(guide.resetSetupGuide(personal)).rejects.toThrow();
    state.userId = a;
  });

  test("guide completion comes from contributions by either member in the target space", async () => {
    const complete = await finishedSpace("Démarrage commun");
    await native.query("INSERT INTO space_memberships(space_id,user_id) VALUES($1,$2)",[complete,b]);
    state.userId = b;
    expect(await guide.getOrInitSetupGuideData(complete)).toMatchObject({stepsCompletion:{income:true,expense:true,generate:true,pay:true},isCompleted:true,isVisible:true});
    await guide.completeSetupGuide(complete);await guide.dismissSetupGuide(complete);
    state.userId = a;
    expect(await guide.getOrInitSetupGuideData(complete)).toMatchObject({isCompleted:true,isVisible:false});
    expect(await guide.getOrInitSetupGuideData(personal)).toMatchObject({isCompleted:false,isVisible:true});
  });

  test("old guide dates survive repeated complete/dismiss; reset stays local", async () => {
    await native.query("UPDATE space_setup_guide SET completed_at='2020-01-01',dismissed_at='2020-01-02' WHERE space_id=$1",[common]);
    const before=await timestamps(common),other=await timestamps(personal);
    state.userId=b;
    await Promise.all([guide.completeSetupGuide(common),guide.completeSetupGuide(common),guide.dismissSetupGuide(common),guide.dismissSetupGuide(common)]);
    expect(await timestamps(common)).toEqual(before);
    expect(await guide.getOrInitSetupGuideData(common)).toMatchObject({isVisible:false});
    await guide.resetSetupGuide(common);
    expect(await timestamps(common)).toMatchObject({completed_at:null,dismissed_at:null});
    expect((await timestamps(common)).reset_at).not.toBeNull();
    state.userId=a;
    expect(await timestamps(personal)).toEqual(other);
  });

  test("completed legacy space without a guide stays hidden and absent; explicit reset can create one",async()=>{
    const id=await finishedSpace("Ancien complet");
    await native.query("DELETE FROM space_setup_guide WHERE space_id=$1",[id]);
    expect(await guide.getOrInitSetupGuideData(id)).toMatchObject({isCompleted:true,isVisible:false});
    expect(await timestamps(id)).toBeUndefined();
    await guide.resetSetupGuide(id);
    expect(await guide.getOrInitSetupGuideData(id)).toMatchObject({isCompleted:true,isVisible:true});
  });

  test("missing incomplete guide initializes once under concurrent reads",async()=>{
    const id=await space("Guide absent");
    await native.query("DELETE FROM space_setup_guide WHERE space_id=$1",[id]);
    const results=await Promise.all(Array.from({length:4},()=>guide.getOrInitSetupGuideData(id)));
    expect(results.every(result=>result.isVisible&&!result.isCompleted)).toBe(true);
    expect((await native.query("SELECT count(*) FROM space_setup_guide WHERE space_id=$1",[id])).rows[0].count).toBe("1");
  });
});
