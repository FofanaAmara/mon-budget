import { beforeAll, afterAll, describe, test, expect, vi } from "vitest";
import { randomUUID, randomBytes } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import type { DatabaseSql } from "@/lib/database/types";
import { createLocalDatabase } from "@/lib/database/local";
import { localConnection, testBaseline } from "../../scripts/financial-spaces/local-fixture.mjs";
import { runMigrations } from "../../scripts/financial-spaces/migrate.mjs";

const state = vi.hoisted(() => ({ userId: "fixture-finance-a" as string | null, sql: null as DatabaseSql | null }));
vi.mock("@/lib/auth/server", () => {
  const getSession = async () => ({ data: state.userId ? { user: { id: state.userId, name: state.userId, email: "fixture@example.test" } } : null });
  return { auth: { getSession }, authSessionReader: { getSession } };
});
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ sql: Object.assign((strings: TemplateStringsArray, ...values: unknown[]) => state.sql!(strings, ...values), {
  transaction: (...args: Parameters<DatabaseSql["transaction"]>) => state.sql!.transaction(...args),
}) }));

import * as cards from "@/lib/actions/financial/cards";
import * as sections from "@/lib/actions/financial/sections";
import * as debts from "@/lib/actions/financial/debts";
import * as savings from "@/lib/actions/financial/savings";
import { createSpace } from "@/lib/actions/spaces";
import * as incomes from "@/lib/actions/financial/incomes";
import * as monthlyIncomes from "@/lib/actions/financial/monthly-incomes";
import { dismissSetupGuide, completeSetupGuide, resetSetupGuide, getOrInitSetupGuideData } from "@/lib/actions/financial/setup-guide";

const database = "spaces_migration_test_" + randomBytes(4).toString("hex");
let native: Awaited<ReturnType<typeof localConnection>>;
let adapter: ReturnType<typeof createLocalDatabase>;
let couple: string, personalA: string, personalB: string;
let card: string, category: string, foreignCard: string, foreignCategory: string;
const a = "fixture-finance-a", b = "fixture-finance-b", c = "fixture-finance-c";
const sectionInput = { name: "Maison", icon: "home", color: "#112233" };
const debtInput = { name: "Prêt", original_amount: 1000, remaining_balance: 100, payment_amount: 10, payment_frequency: "MONTHLY" as const };

async function space(name: string) {
  const result = await createSpace({ name, creationKey: randomUUID() });
  if (!result.ok) throw new Error(result.error);
  return result.data.id;
}
async function project(spaceId: string, balance = 0, name = "Projet") {
  return (await native.query(`INSERT INTO expenses(space_id,user_id,name,amount,type,saved_amount)
    VALUES($1,$2,$3,100,'PLANNED',$4) RETURNING id`, [spaceId, a, name, balance])).rows[0].id as string;
}
async function balance(id: string) {
  return Number((await native.query("SELECT saved_amount FROM expenses WHERE id=$1", [id])).rows[0].saved_amount);
}
async function journal(ids: string[]) {
  return (await native.query("SELECT * FROM savings_contributions WHERE expense_id=ANY($1::uuid[]) ORDER BY created_at,id", [ids])).rows;
}
async function waitForFixtureLock(queryFragment: string) {
  const deadline = Date.now()+3000;
  while (Date.now()<deadline) {
    // Statistics snapshots are cached inside the writer's transaction.
    await native.query("SELECT pg_stat_clear_snapshot()");
    const result=await native.query(`SELECT 1 FROM pg_stat_activity WHERE datname=current_database()
      AND wait_event_type='Lock' AND query LIKE $1`,["%"+queryFragment+"%"]);
    if(result.rowCount) return;
    await delay(10);
  }
  throw new Error("Expected concurrent application query was not observed waiting on a database lock.");
}

// These are actual application actions against PostgreSQL. Only Auth and Next's
// cache invalidation are stubbed. Membership seeding is not invitation proof.
describe("financial actions — persistent shared-space isolation", () => {
  beforeAll(async () => {
    const admin = await localConnection();
    try { await admin.query(`CREATE DATABASE "${database}" TEMPLATE "${testBaseline()}"`); }
    finally { await admin.end(); }
    native = await localConnection(database);
    await runMigrations(native, { through: "006", dryRun: false, allowCutover: true });
    const identifier = (await native.query("SELECT system_identifier::text FROM pg_control_system()")).rows[0].system_identifier;
    adapter = createLocalDatabase(`postgresql://budget_test:local-fixture-only@127.0.0.1:55437/${database}`, identifier);
    state.sql = adapter.sql;
    couple = await space("Couple"); personalA = await space("Personnel Alice");
    state.userId = b; personalB = await space("Personnel Bob");
    await native.query("INSERT INTO space_memberships(space_id,user_id) VALUES($1,$2)", [couple,b]);
    state.userId = a;
    card = (await cards.createCard(couple, { name: "Carte commune" })).id;
    category = (await sections.createSection(couple, sectionInput)).id;
    foreignCard = (await cards.createCard(personalA, { name: "Carte privée" })).id;
    foreignCategory = (await sections.createSection(personalA, sectionInput)).id;
  });
  afterAll(async () => {
    if (adapter) await adapter.close();
    if (native) await native.end();
    const admin = await localConnection();
    try { await admin.query(`DROP DATABASE "${database}"`); }
    finally { await admin.end(); }
  });

  test("both members see and edit shared cards/categories without changing provenance", async () => {
    state.userId = b;
    expect((await cards.getCards(couple)).map(row => row.id)).toEqual([card]);
    expect((await sections.getSections(couple)).some(row => row.id === category)).toBe(true);
    expect(await cards.updateCard(couple, card, { name: "Carte renommée par Bob" })).toMatchObject({ name: "Carte renommée par Bob", user_id: a });
    expect(await sections.updateSection(couple, category, { name: "Notre maison" })).toMatchObject({ name: "Notre maison", user_id: a });
    expect(await cards.getCards(personalB)).toEqual([]);
    state.userId = a;
    expect((await cards.getCardById(couple, card))?.name).toBe("Carte renommée par Bob");
    expect((await sections.getSections(couple)).find(row => row.id === category)?.name).toBe("Notre maison");
  });

  test("membership and explicit space are required for every family", async () => {
    for (const userId of [c, null]) {
      state.userId = userId;
      for (const action of [() => cards.getCards(couple), () => sections.getSections(couple), () => debts.getDebts(couple),
        () => savings.getPlannedExpenses(couple), () => savings.getOrCreateFreeSavings(couple),
        () => cards.createCard(couple,{name:"Intrusion"}), () => sections.reorderSections(couple,[category]),
        () => debts.createDebt(couple,debtInput), () => savings.addSavingsContribution(couple,randomUUID(),1)]) {
        await expect(action()).rejects.toThrow();
      }
    }
    state.userId = b;
    await expect(cards.getCards(personalA)).rejects.toThrow(/inaccessible/);
    await expect(savings.getMonthlySavingsSummary(personalA,"2026-10")).rejects.toThrow(/inaccessible/);
    await expect(cards.getCards("invalid")).rejects.toThrow(/inaccessible/);
    state.userId = a;
  });

  test("foreign card/category IDs cannot be read, updated, deleted or partially reordered", async () => {
    expect(await cards.getCardById(couple,foreignCard)).toBeNull();
    for (const action of [() => cards.updateCard(couple,foreignCard,{name:"Bad"}), () => cards.deleteCard(couple,foreignCard),
      () => sections.updateSection(couple,foreignCategory,{name:"Bad"}), () => sections.deleteSection(couple,foreignCategory)]) {
      await expect(action()).rejects.toThrow(/inaccessible/);
    }
    const before = await sections.getSections(couple);
    await expect(sections.reorderSections(couple,[category,foreignCategory])).rejects.toThrow(/inaccessible/);
    expect(await sections.getSections(couple)).toEqual(before);
    await expect(sections.reorderSections(couple,[category,category])).rejects.toThrow(/distinctes/);
    const order = before.map(row=>row.id).reverse();
    await sections.reorderSections(couple,order);
    expect((await sections.getSections(couple)).map(row=>row.id)).toEqual(order);
    expect((await cards.getCardById(personalA,foreignCard))?.name).toBe("Carte privée");
  });

  test("debt parents must be in the same space; failed changes preserve all data", async () => {
    await expect(debts.createDebt(couple,{...debtInput,card_id:foreignCard})).rejects.toThrow(/référence/);
    await expect(debts.createDebt(couple,{...debtInput,section_id:foreignCategory})).rejects.toThrow(/référence/);
    const debt = await debts.createDebt(couple,{...debtInput,card_id:card,section_id:category});
    await expect(debts.updateDebt(couple,debt.id,{name:"Wrong",card_id:foreignCard})).rejects.toThrow(/référence/);
    expect((await debts.getDebts(couple)).find(row=>row.id===debt.id)).toMatchObject({name:"Prêt",card_id:card,section_id:category});
    const foreign = await debts.createDebt(personalA,debtInput);
    expect(await debts.getTotalDebtBalance(couple)).toBe(100);
    expect(await debts.getTotalDebtBalance(personalA)).toBe(100);
    await expect(debts.updateDebt(couple,foreign.id,{name:"Bad"})).rejects.toThrow(/inaccessible/);
    await expect(debts.makeExtraPayment(couple,foreign.id,10)).rejects.toThrow(/inaccessible/);
    await expect(debts.deleteDebt(couple,foreign.id)).rejects.toThrow(/inaccessible/);
    expect((await debts.getDebts(personalA)).find(row=>row.id===foreign.id)?.remaining_balance).toBe("100.00");
    expect((await native.query("SELECT 1 FROM debt_transactions WHERE debt_id=$1",[foreign.id])).rowCount).toBe(0);
  });

  test("concurrent debt payments apply and log at most the remaining balance", async () => {
    const debt = await debts.createDebt(couple,debtInput);
    state.userId=b;
    const results=await Promise.allSettled([debts.makeExtraPayment(couple,debt.id,80),debts.makeExtraPayment(couple,debt.id,80)]);
    expect(results.every(row=>row.status==="fulfilled")).toBe(true);
    const saved=(await native.query("SELECT remaining_balance,is_active FROM debts WHERE id=$1",[debt.id])).rows[0];
    expect(saved).toMatchObject({remaining_balance:"0.00",is_active:false});
    const logs=(await native.query("SELECT amount,user_id,space_id FROM debt_transactions WHERE debt_id=$1 ORDER BY amount",[debt.id])).rows;
    expect(logs.map(row=>Number(row.amount))).toEqual([20,80]);
    expect(logs.every(row=>row.user_id===b&&row.space_id===couple)).toBe(true);
    await expect(debts.makeExtraPayment(couple,debt.id,10)).rejects.toThrow(/inaccessible/);
    state.userId=a;
  });

  test("failed payment journal rolls back the balance change", async () => {
    const debt=await debts.createDebt(couple,{...debtInput,name:"Rollback"});
    await native.query(`CREATE FUNCTION fixture_reject_payment() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture payment failure'; END $$`);
    await native.query(`CREATE TRIGGER fixture_reject_payment BEFORE INSERT ON debt_transactions FOR EACH ROW EXECUTE FUNCTION fixture_reject_payment()`);
    try { await expect(debts.makeExtraPayment(couple,debt.id,20)).rejects.toThrow(/fixture payment failure/); }
    finally { await native.query("DROP TRIGGER fixture_reject_payment ON debt_transactions"); }
    expect((await native.query("SELECT remaining_balance FROM debts WHERE id=$1",[debt.id])).rows[0].remaining_balance).toBe("100.00");
  });

  test("card/category deletion atomically unlinks children while keeping their space", async () => {
    const disposableCard=(await cards.createCard(couple,{name:"Delete"})).id;
    const disposableSection=(await sections.createSection(couple,sectionInput)).id;
    const debt=await debts.createDebt(couple,{...debtInput,card_id:disposableCard,section_id:disposableSection});
    const expense=await project(couple);
    await native.query("UPDATE expenses SET card_id=$1,section_id=$2 WHERE id=$3",[disposableCard,disposableSection,expense]);
    const monthly=(await native.query(`INSERT INTO monthly_expenses(space_id,user_id,expense_id,name,amount,month,status,card_id,section_id)
      VALUES($1,$2,$3,'Fixture',10,'2026-10','UPCOMING',$4,$5) RETURNING id`,[couple,a,expense,disposableCard,disposableSection])).rows[0].id;
    state.userId=b;
    expect(await sections.getSectionExpenseCount(couple,disposableSection)).toBe(1);
    await cards.deleteCard(couple,disposableCard); await sections.deleteSection(couple,disposableSection);
    for(const [table,id] of [["debts",debt.id],["expenses",expense],["monthly_expenses",monthly]]) {
      expect((await native.query(`SELECT space_id,card_id,section_id FROM ${table} WHERE id=$1`,[id])).rows[0])
        .toEqual({space_id:couple,card_id:null,section_id:null});
    }
    expect(await sections.getSectionExpenseCount(couple,disposableSection)).toBe(0);
    state.userId=a;
  });

  test("contributions are shared, keep actor provenance and reject cross-space parents", async () => {
    const common=await project(couple,0,"Commun"); const privateProject=await project(personalA,30);
    state.userId=b;
    await savings.addSavingsContribution(couple,common,25,"Bob");
    expect(await balance(common)).toBe(25);
    expect(await savings.getSavingsContributions(couple,common)).toMatchObject([{user_id:b,space_id:couple,note:"Bob"}]);
    expect(await savings.updateSavedAmount(couple,common,35)).toMatchObject({saved_amount:"35.00",user_id:a});
    await expect(savings.addSavingsContribution(couple,privateProject,5)).rejects.toThrow(/inaccessible/);
    await expect(savings.updateSavedAmount(couple,privateProject,500)).rejects.toThrow(/inaccessible/);
    expect(await savings.getSavingsContributions(couple,privateProject)).toEqual([]);
    expect(await balance(privateProject)).toBe(30);
    state.userId=a;
    expect((await savings.getPlannedExpenses(couple)).some(row=>row.id===common)).toBe(true);
    expect(await savings.getSavingsContributions(couple,common)).toHaveLength(1);
  });

  test("two simultaneous transfers cannot overspend one source; both journal entries agree", async () => {
    const from=await project(couple,100,"Source"), to=await project(couple,0,"Destination");
    const results=await Promise.allSettled(Array.from({length:2},()=>savings.transferSavings(couple,{fromId:from,toId:to,amount:80,fromName:"FAKE",toName:"FAKE"})));
    expect(results.filter(row=>row.status==="fulfilled")).toHaveLength(1);
    expect(results.filter(row=>row.status==="rejected")).toHaveLength(1);
    expect(await balance(from)).toBe(20); expect(await balance(to)).toBe(80);
    const logs=await journal([from,to]);
    expect(logs).toHaveLength(2);
    expect(logs.reduce((sum,row)=>sum+Number(row.amount),0)).toBe(0);
    expect(logs.map(row=>row.note).sort()).toEqual(["Transfert depuis Source","Transfert vers Destination"]);
  });

  test("foreign destination, wrong type, same ID and insufficient funds leave no partial transfer", async () => {
    const from=await project(couple,10), foreign=await project(personalA,0), to=await project(couple,0);
    const ordinary=(await native.query(`INSERT INTO expenses(space_id,user_id,name,amount,type) VALUES($1,$2,'Charge',1,'ONE_TIME') RETURNING id`,[couple,a])).rows[0].id;
    for(const [target,amount] of [[foreign,5],[ordinary,5],[from,5],[to,20]] as const) {
      await expect(savings.transferSavings(couple,{fromId:from,toId:target,amount,fromName:"Source",toName:"Cible"})).rejects.toThrow();
    }
    expect(await balance(from)).toBe(10); expect(await balance(to)).toBe(0); expect(await balance(foreign)).toBe(0);
    expect(await journal([from,to,foreign,ordinary])).toHaveLength(0);
    await expect(savings.addSavingsContribution(couple,ordinary,5)).rejects.toThrow(/inaccessible/);
  });

  test("opposing transfers lock in a common order and conserve money", async () => {
    const left=await project(couple,100),right=await project(couple,100);
    const transfer=(fromId:string,toId:string)=>savings.transferSavings(couple,{fromId,toId,amount:10,fromName:"A",toName:"B"});
    await Promise.all([transfer(left,right),transfer(right,left)]);
    expect(await balance(left)).toBe(100); expect(await balance(right)).toBe(100);
    expect(await journal([left,right])).toHaveLength(4);
  });

  test("concurrent negative contributions never make the shared balance negative", async () => {
    const id=await project(couple,10);
    const results=await Promise.allSettled(Array.from({length:3},()=>savings.addSavingsContribution(couple,id,-5)));
    expect(results.filter(row=>row.status==="fulfilled")).toHaveLength(2);
    expect(await balance(id)).toBe(0); expect(await journal([id])).toHaveLength(2);
  });

  test("free savings is unique under concurrency, survives renaming and is isolated", async () => {
    const results=await Promise.all(Array.from({length:4},()=>savings.getOrCreateFreeSavings(couple)));
    expect(new Set(results.map(row=>row.id)).size).toBe(1);
    const id=results[0].id;
    await native.query("UPDATE expenses SET name='Notre réserve',saved_amount=42 WHERE id=$1",[id]);
    state.userId=b;
    expect(await savings.getOrCreateFreeSavings(couple)).toMatchObject({id,name:"Notre réserve",saved_amount:"42.00",user_id:a});
    expect((await savings.getOrCreateFreeSavings(personalB)).id).not.toBe(id);
    state.userId=a;
  });

  test("monthly summary includes both members and excludes another space", async () => {
    const id=await project(couple,0), other=await project(personalA,0);
    await savings.addSavingsContribution(couple,id,12);
    state.userId=b; await savings.addSavingsContribution(couple,id,3); state.userId=a;
    await savings.addSavingsContribution(personalA,other,900);
    const month=(await native.query("SELECT to_char(current_date,'YYYY-MM') AS month")).rows[0].month;
    const summary=await savings.getMonthlySavingsSummary(couple,month);
    expect(summary.byProject.find(row=>row.expense_id===id)?.total).toBe(15);
    expect(summary.byProject.some(row=>row.expense_id===other)).toBe(false);
    expect(summary.contributionCount).toBe(Number((await native.query("SELECT count(*) FROM savings_contributions WHERE space_id=$1",[couple])).rows[0].count));
  });

  test("fractional cents are rejected before money moves and float arithmetic is normalized", async () => {
    const from=await project(couple,1),to=await project(couple,0);
    const debt=await debts.createDebt(couple,debtInput);
    for(const amount of [0.005,0.004,-0.005,-0.004]) {
      await expect(savings.addSavingsContribution(couple,from,amount)).rejects.toThrow(/décimales/);
      await expect(savings.transferSavings(couple,{fromId:from,toId:to,amount,fromName:"A",toName:"B"})).rejects.toThrow();
      await expect(debts.makeExtraPayment(couple,debt.id,amount)).rejects.toThrow();
    }
    expect(await balance(from)).toBe(1); expect(await balance(to)).toBe(0);
    expect(await journal([from,to])).toHaveLength(0);
    await savings.transferSavings(couple,{fromId:from,toId:to,amount:0.1+0.2,fromName:"A",toName:"B"});
    expect(await balance(from)).toBe(0.7); expect(await balance(to)).toBe(0.3);
    const huge=await project(couple,99_999_999.99),empty=await project(couple,0);
    await savings.transferSavings(couple,{fromId:huge,toId:empty,amount:99_999_999.99,fromName:"A",toName:"B"});
    expect(await balance(huge)).toBe(0); expect(await balance(empty)).toBe(99_999_999.99);
    await expect(savings.addSavingsContribution(couple,empty,100_000_000)).rejects.toThrow();
  });

  test("income partial updates preserve unspecified values and support a nullable variable amount", async () => {
    const fixed=await incomes.createIncome(couple,{name:"Salaire",source:"EMPLOYMENT",amount:1200,estimated_amount:null,
      frequency:"MONTHLY",pay_anchor_date:"2026-10-02",auto_deposit:true,notes:"Original"});
    state.userId=b;
    const renamed=await incomes.updateIncome(couple,fixed.id,{name:"Salaire commun"});
    expect(renamed).toMatchObject({name:"Salaire commun",amount:"1200.00",auto_deposit:true,notes:"Original",user_id:a});
    expect(renamed.pay_anchor_date).toBeInstanceOf(Date);
    const variable=await incomes.createIncome(couple,{name:"Missions",source:"BUSINESS",amount:null,estimated_amount:200,frequency:"VARIABLE"});
    expect(variable.amount).toBeNull();
    await expect(incomes.createIncome(couple,{name:"Fixe sans montant",source:"OTHER",amount:null,estimated_amount:null,frequency:"MONTHLY"})).rejects.toThrow(/positif/);
    await expect(incomes.updateIncome(couple,variable.id,{frequency:"MONTHLY"})).rejects.toThrow();
    expect((await incomes.getIncomes(couple)).find(row=>row.id===variable.id)?.frequency).toBe("VARIABLE");
    await expect(native.query("UPDATE incomes SET frequency='MONTHLY' WHERE id=$1",[variable.id])).rejects.toMatchObject({code:"23514",constraint:"incomes_fixed_positive_amount"});
    await incomes.updateIncome(couple,variable.id,{estimated_amount:null});
    expect((await incomes.getIncomes(couple)).find(row=>row.id===variable.id)?.estimated_amount).toBeNull();
    expect(await incomes.getMonthlyIncomeTotal(couple)).toBe(1200);
    await incomes.deleteIncome(couple,variable.id);
    expect((await incomes.getIncomes(couple)).some(row=>row.id===variable.id)).toBe(false);
    state.userId=a;
  });

  test("income mutations and generators reject a non-member and cross-space IDs", async () => {
    const foreign=await incomes.createIncome(personalA,{name:"Privé",source:"OTHER",amount:25,estimated_amount:null,frequency:"MONTHLY"});
    await monthlyIncomes.generateMonthlyIncomes(personalA,"2026-09");
    const instance=(await monthlyIncomes.getMonthlyIncomeSummary(personalA,"2026-09")).items[0].id;
    state.userId=b;
    await expect(incomes.getIncomes(personalA)).rejects.toThrow(/inaccessible/);
    await expect(monthlyIncomes.generateMonthlyIncomes(personalA,"2026-10")).rejects.toThrow(/inaccessible/);
    for(const action of [() => incomes.updateIncome(couple,foreign.id,{name:"Bad"}),() => incomes.deleteIncome(couple,foreign.id),
      () => monthlyIncomes.markIncomeReceived(couple,instance,5),() => monthlyIncomes.markIncomeAsExpected(couple,instance),
      () => monthlyIncomes.deleteMonthlyIncome(couple,instance),() => monthlyIncomes.updateMonthlyIncomeAmount(couple,instance,5),
      () => monthlyIncomes.markVariableIncomeReceived(couple,foreign.id,"2026-10",10)]) {
      await expect(action()).rejects.toThrow(/inaccessible/);
    }
    expect((await monthlyIncomes.getMonthlyIncomeSummary(couple,"2026-09")).items).toHaveLength(0);
    state.userId=a;
    expect((await monthlyIncomes.getMonthlyIncomeSummary(personalA,"2026-09")).expectedTotal).toBe(25);
  });

  test("monthly income generation is shared, concurrent and preserves manually edited/received values", async () => {
    const fixed=await incomes.createIncome(couple,{name:"Génération",source:"OTHER",amount:100,estimated_amount:null,frequency:"MONTHLY"});
    const biweekly=await incomes.createIncome(couple,{name:"Deux semaines",source:"EMPLOYMENT",amount:100,estimated_amount:null,
      frequency:"BIWEEKLY",pay_anchor_date:"2026-10-02"});
    const yearly=await incomes.createIncome(couple,{name:"Annuel",source:"OTHER",amount:120,estimated_amount:null,frequency:"YEARLY"});
    const variable=await incomes.createIncome(couple,{name:"Variable",source:"BUSINESS",amount:null,estimated_amount:50,frequency:"VARIABLE"});
    await Promise.all(Array.from({length:4},()=>monthlyIncomes.generateMonthlyIncomes(couple,"2026-10")));
    state.userId=b;
    let summary=await monthlyIncomes.getMonthlyIncomeSummary(couple,"2026-10");
    const find=(incomeId:string)=>summary.items.find(row=>row.income_id===incomeId)!;
    expect(summary.items.filter(row=>row.income_id===fixed.id)).toHaveLength(1);
    expect(Number(find(biweekly.id).expected_amount)).toBe(300);
    expect(Number(find(yearly.id).expected_amount)).toBe(10);
    expect(summary.items.some(row=>row.income_id===variable.id)).toBe(false);
    await monthlyIncomes.updateMonthlyIncomeAmount(couple,find(fixed.id).id,60);
    await monthlyIncomes.markIncomeReceived(couple,find(yearly.id).id,9,"Réel");
    await incomes.updateIncome(couple,fixed.id,{amount:500}); await incomes.updateIncome(couple,yearly.id,{amount:240});
    await monthlyIncomes.generateMonthlyIncomes(couple,"2026-10");
    summary=await monthlyIncomes.getMonthlyIncomeSummary(couple,"2026-10");
    expect(Number(find(fixed.id).expected_amount)).toBe(60);
    expect(find(yearly.id)).toMatchObject({expected_amount:"10.00",actual_amount:"9.00",status:"RECEIVED",notes:"Réel"});
    await monthlyIncomes.markIncomeAsExpected(couple,find(fixed.id).id);
    await monthlyIncomes.generateMonthlyIncomes(couple,"2026-10");
    summary=await monthlyIncomes.getMonthlyIncomeSummary(couple,"2026-10");
    expect(Number(find(fixed.id).expected_amount)).toBe(500);
    state.userId=a;
  });

  test("automatic and variable receipts remain confined to the explicit space", async () => {
    const automatic=await incomes.createIncome(couple,{name:"Auto",source:"EMPLOYMENT",amount:200,estimated_amount:null,frequency:"MONTHLY",auto_deposit:true});
    await monthlyIncomes.generateMonthlyIncomes(couple,"2026-11");
    await monthlyIncomes.generateMonthlyIncomes(personalA,"2026-11");
    state.userId=b;
    await monthlyIncomes.autoMarkReceivedForAutoDeposit(couple,"2026-11");
    const summary=await monthlyIncomes.getMonthlyIncomeSummary(couple,"2026-11");
    expect(summary.items.find(row=>row.income_id===automatic.id)).toMatchObject({status:"RECEIVED",actual_amount:"200.00"});
    const variable=await incomes.createIncome(couple,{name:"Reçu variable",source:"OTHER",amount:null,estimated_amount:0,frequency:"VARIABLE"});
    await monthlyIncomes.markVariableIncomeReceived(couple,variable.id,"2026-11",35);
    await monthlyIncomes.markVariableIncomeReceived(couple,variable.id,"2026-11",40);
    const items=(await monthlyIncomes.getMonthlyIncomeSummary(couple,"2026-11")).items.filter(row=>row.income_id===variable.id);
    expect(items).toHaveLength(1); expect(Number(items[0].actual_amount)).toBe(40);
    await expect(monthlyIncomes.deleteMonthlyIncome(couple,items[0].id)).rejects.toThrow(/inaccessible/);
    await expect(monthlyIncomes.markVariableIncomeReceived(couple,automatic.id,"2026-11",20)).rejects.toThrow(/inaccessible/);
    state.userId=a;
    expect((await monthlyIncomes.getMonthlyIncomeSummary(personalA,"2026-11")).items.every(row=>row.status==="EXPECTED")).toBe(true);
  });

  test("one-time income creation is atomic and inactive without affecting another space", async () => {
    await incomes.createAdhocIncome(couple,"Ponctuel",0.1+0.2,"OTHER","2026-12");
    const items=(await monthlyIncomes.getMonthlyIncomeSummary(couple,"2026-12")).items;
    expect(items).toHaveLength(1); expect(items[0]).toMatchObject({actual_amount:"0.30",status:"RECEIVED"});
    expect((await incomes.getIncomes(couple)).some(row=>row.id===items[0].income_id)).toBe(false);
    const before=(await native.query("SELECT count(*) FROM incomes WHERE space_id=$1",[couple])).rows[0].count;
    await native.query(`CREATE FUNCTION fixture_reject_income() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture income failure'; END $$`);
    await native.query(`CREATE TRIGGER fixture_reject_income BEFORE INSERT ON monthly_incomes FOR EACH ROW EXECUTE FUNCTION fixture_reject_income()`);
    try { await expect(incomes.createAdhocIncome(couple,"Rollback",10,"OTHER","2026-12")).rejects.toThrow(/fixture income failure/); }
    finally { await native.query("DROP TRIGGER fixture_reject_income ON monthly_incomes"); }
    expect((await native.query("SELECT count(*) FROM incomes WHERE space_id=$1",[couple])).rows[0].count).toBe(before);
    await monthlyIncomes.deleteMonthlyIncome(couple,items[0].id);
    expect((await monthlyIncomes.getMonthlyIncomeSummary(couple,"2026-12")).items).toHaveLength(0);
  });

  test("historical monthly income without a template remains visible in its space", async () => {
    await native.query(`INSERT INTO monthly_incomes(space_id,user_id,month,expected_amount,status)
      VALUES($1,$2,'2026-08',42,'EXPECTED')`,[couple,a]);
    const summary=await monthlyIncomes.getMonthlyIncomeSummary(couple,"2026-08");
    expect(summary.expectedTotal).toBe(42);
    expect(summary.items).toMatchObject([{income_id:null,income_name:"Revenu ponctuel"}]);
    expect((await monthlyIncomes.getMonthlyIncomeSummary(personalA,"2026-08")).items).toHaveLength(0);
  });

  test("a queued generator uses the newer template and automatic receipt amount after the writer commits", async () => {
    const fixed=await incomes.createIncome(couple,{name:"Concurrent édité",source:"OTHER",amount:100,estimated_amount:null,
      frequency:"MONTHLY",auto_deposit:false});
    await monthlyIncomes.generateMonthlyIncomes(couple,"2027-01");
    await native.query("BEGIN");
    let generated: Promise<void> | undefined;
    try {
      await native.query("UPDATE incomes SET amount=200,auto_deposit=true WHERE id=$1",[fixed.id]);
      await native.query("UPDATE monthly_incomes SET expected_amount=200,is_auto_deposited=true WHERE income_id=$1 AND month='2027-01'",[fixed.id]);
      generated=monthlyIncomes.generateMonthlyIncomes(couple,"2027-01");
      await waitForFixtureLock("INSERT INTO monthly_incomes");
      await native.query("COMMIT");
      await generated;
    } finally { await native.query("ROLLBACK"); if(generated) await generated; }
    await monthlyIncomes.autoMarkReceivedForAutoDeposit(couple,"2027-01");
    expect((await monthlyIncomes.getMonthlyIncomeSummary(couple,"2027-01")).items.find(row=>row.income_id===fixed.id))
      .toMatchObject({expected_amount:"200.00",actual_amount:"200.00",is_auto_deposited:true,status:"RECEIVED"});
    await monthlyIncomes.markIncomeAsExpected(couple,(await monthlyIncomes.getMonthlyIncomeSummary(couple,"2027-01")).items.find(row=>row.income_id===fixed.id)!.id);
    await incomes.updateIncome(couple,fixed.id,{auto_deposit:false});
    await monthlyIncomes.autoMarkReceivedForAutoDeposit(couple,"2027-01");
    expect((await monthlyIncomes.getMonthlyIncomeSummary(couple,"2027-01")).items.find(row=>row.income_id===fixed.id)?.status).toBe("EXPECTED");
  });

  test("concurrent category deletion cannot partially apply a reorder", async () => {
    const first=await sections.createSection(couple,sectionInput),second=await sections.createSection(couple,sectionInput);
    await native.query("BEGIN");
    let reordered: Promise<unknown> | undefined;
    try {
      await native.query("DELETE FROM sections WHERE id=$1",[second.id]);
      reordered=sections.reorderSections(couple,[first.id,second.id]).then(()=>({ok:true}),error=>({ok:false,error}));
      await waitForFixtureLock("jsonb_array_elements_text");
      await native.query("COMMIT");
      expect(await reordered).toMatchObject({ok:false});
    } finally { await native.query("ROLLBACK"); if(reordered) await reordered; }
    expect((await sections.getSections(couple)).find(row=>row.id===first.id)?.position).toBe(first.position);
  });

  test("automatic receipt refreshes a template edited after generation while preserving a manual override", async () => {
    const fresh=await incomes.createIncome(couple,{name:"Auto actualisé",source:"OTHER",amount:100,estimated_amount:null,
      frequency:"MONTHLY",auto_deposit:true});
    const manual=await incomes.createIncome(couple,{name:"Auto manuel",source:"OTHER",amount:100,estimated_amount:null,
      frequency:"MONTHLY",auto_deposit:true});
    await monthlyIncomes.generateMonthlyIncomes(couple,"2027-02");
    const summary=await monthlyIncomes.getMonthlyIncomeSummary(couple,"2027-02");
    await monthlyIncomes.updateMonthlyIncomeAmount(couple,summary.items.find(row=>row.income_id===manual.id)!.id,60);
    state.userId=b;
    await incomes.updateIncome(couple,fresh.id,{amount:200});
    await incomes.updateIncome(couple,manual.id,{amount:200});
    await monthlyIncomes.autoMarkReceivedForAutoDeposit(couple,"2027-02");
    const received=await monthlyIncomes.getMonthlyIncomeSummary(couple,"2027-02");
    expect(received.items.find(row=>row.income_id===fresh.id)).toMatchObject({expected_amount:"200.00",actual_amount:"200.00",status:"RECEIVED"});
    expect(received.items.find(row=>row.income_id===manual.id)).toMatchObject({expected_amount:"60.00",actual_amount:"60.00",status:"RECEIVED"});
    state.userId=a;
  });

  test("an already closed legacy guide keeps its historical dates on repeated completion/dismissal", async () => {
    await native.query(`UPDATE space_setup_guide SET completed_at='2020-01-01',dismissed_at='2020-01-02' WHERE space_id=$1`,[couple]);
    const before=(await native.query("SELECT * FROM space_setup_guide WHERE space_id=$1",[couple])).rows[0];
    expect((await getOrInitSetupGuideData(couple))?.isVisible).toBe(false);
    await completeSetupGuide(couple); await dismissSetupGuide(couple); await dismissSetupGuide(couple);
    expect((await native.query("SELECT * FROM space_setup_guide WHERE space_id=$1",[couple])).rows[0]).toEqual(before);
    await resetSetupGuide(couple);
    await dismissSetupGuide(couple);
    expect((await native.query("SELECT dismissed_at FROM space_setup_guide WHERE space_id=$1",[couple])).rows[0].dismissed_at).not.toBeNull();
  });
});
