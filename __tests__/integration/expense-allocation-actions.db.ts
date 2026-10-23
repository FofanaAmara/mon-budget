import {beforeAll,afterAll,describe,test,expect,vi} from "vitest";
import {randomUUID,randomBytes} from "node:crypto";
import {setTimeout as delay} from "node:timers/promises";
import type {DatabaseSql} from "@/lib/database/types";
import {createLocalDatabase} from "@/lib/database/local";
import {localConnection} from "../../scripts/financial-spaces/local-fixture.mjs";
import {runMigrations,legacyFingerprint} from "../../scripts/financial-spaces/migrate.mjs";

const state=vi.hoisted(()=>({userId:"fixture-expenses-a" as string|null,sql:null as DatabaseSql|null}));
vi.mock("@/lib/auth/server",()=>({auth:{getSession:async()=>({data:state.userId?{user:{id:state.userId,name:state.userId,email:"fixture@example.test"}}:null})}}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("@/lib/db",()=>({sql:Object.assign((strings:TemplateStringsArray,...values:unknown[])=>state.sql!(strings,...values),{
  transaction:(...args:Parameters<DatabaseSql["transaction"]>)=>state.sql!.transaction(...args),
})}));
import * as expenses from "@/lib/actions/financial/expenses";
import * as monthly from "@/lib/actions/financial/monthly-expenses";
import * as transactions from "@/lib/actions/financial/expense-transactions";
import * as debtTransactions from "@/lib/actions/financial/debt-transactions";
import * as allocations from "@/lib/actions/financial/allocations";
import {createDebt,getDebts,deleteDebt} from "@/lib/actions/financial/debts";
import {createCard} from "@/lib/actions/financial/cards";
import {createSection} from "@/lib/actions/financial/sections";
import {createSpace} from "@/lib/actions/spaces";
import {calcDueDateForMonth} from "@/lib/utils";
import type {CreateExpenseInput} from "@/lib/schemas/expense";

const database="spaces_migration_test_"+randomBytes(4).toString("hex");
const a="fixture-expenses-a",b="fixture-expenses-b",c="fixture-expenses-c";
let native:Awaited<ReturnType<typeof localConnection>>,adapter:ReturnType<typeof createLocalDatabase>;
let common:string,personal:string,card:string,section:string,section2:string,foreignCard:string,foreignSection:string;
async function newSpace(name:string) {const result=await createSpace({name,creationKey:randomUUID()});if(!result.ok)throw new Error(result.error);return result.data.id;}
async function template(data:Partial<CreateExpenseInput>={},spaceId=common) {
  return expenses.createExpense(spaceId,{name:"Charge",amount:100,type:"RECURRING",recurrence_frequency:"MONTHLY",recurrence_day:10,...data});
}
async function debt(balance=100,payment=30) {return createDebt(common,{name:"Dette",original_amount:1000,remaining_balance:balance,payment_amount:payment,payment_frequency:"MONTHLY",payment_day:10,section_id:section});}
async function instance(spaceId:string=common,fields:Record<string,unknown>={}) {
  const row={space_id:spaceId,user_id:a,month:"2027-01",name:"Imprévu",amount:10,status:"UPCOMING",...fields};
  return (await native.query(`INSERT INTO monthly_expenses(${Object.keys(row).join(',')}) VALUES(${Object.keys(row).map((_,i)=>'$'+(i+1)).join(',')}) RETURNING *`,Object.values(row))).rows[0];
}
async function record(table:string,id:string) {return (await native.query(`SELECT * FROM ${table} WHERE id=$1`,[id])).rows[0];}
async function debtLogs(id:string) {return (await native.query("SELECT * FROM debt_transactions WHERE debt_id=$1 ORDER BY created_at,id",[id])).rows;}
async function waitForLock(fragment:string) {
  const end=Date.now()+3000;
  while(Date.now()<end){await native.query("SELECT pg_stat_clear_snapshot()");
    if((await native.query("SELECT 1 FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE $1",['%'+fragment+'%'])).rowCount)return;
    await delay(10);}
  throw new Error("Concurrent application query never reached the observed lock wait.");
}

describe("expenses and allocations — real PostgreSQL, Auth/cache stubbed",()=>{
  beforeAll(async()=>{
    const admin=await localConnection();try{await admin.query(`CREATE DATABASE "${database}" TEMPLATE spaces_baseline17`);}finally{await admin.end();}
    native=await localConnection(database);
    const before=await legacyFingerprint(native);
    await runMigrations(native,{through:"006",dryRun:false,allowCutover:true});
    expect(await legacyFingerprint(native)).toEqual(before);
    const systemId=(await native.query("SELECT system_identifier::text FROM pg_control_system()")).rows[0].system_identifier;
    adapter=createLocalDatabase(`postgresql://budget_test:local-fixture-only@127.0.0.1:55437/${database}`,systemId);state.sql=adapter.sql;
    common=await newSpace("Couple");personal=await newSpace("Personnel");
    await native.query("INSERT INTO space_memberships(space_id,user_id) VALUES($1,$2)",[common,b]);
    card=(await createCard(common,{name:"Commune"})).id;
    section=(await createSection(common,{name:"Maison",icon:"home",color:"#112233"})).id;
    section2=(await createSection(common,{name:"Loisirs",icon:"star",color:"#334455"})).id;
    foreignCard=(await createCard(personal,{name:"Privée"})).id;
    foreignSection=(await createSection(personal,{name:"Privé",icon:"star",color:"#334455"})).id;
  });
  afterAll(async()=>{
    if(adapter)await adapter.close();if(native)await native.end();
    const admin=await localConnection();try{await admin.query(`DROP DATABASE "${database}"`);}finally{await admin.end();}
  });

  test("pure SQL due dates match the established monthly calendar, including leap days and offsets",async()=>{
    for(const frequency of ["MONTHLY","BIMONTHLY","QUARTERLY","YEARLY","WEEKLY","BIWEEKLY"] as const)
      for(const month of ["2024-02","2026-02","2026-10","2027-01"])
        for(const anchor of [null,"2026-01-31","2026-10-15"]){
          const day=31;
          const expected=calcDueDateForMonth({recurrence_frequency:frequency,recurrence_day:day,next_due_date:anchor},month);
          const row=(await native.query("SELECT public.space_finance_due_date($1,$2,$3,$4)::text AS value",[frequency,day,anchor,month])).rows[0];
          expect(row.value).toBe(expected);
        }
  });

  test("new templates use the explicit space settings and equal member rights",async()=>{
    await native.query("UPDATE space_settings SET default_currency='EUR',default_reminder_offsets=ARRAY[2,5] WHERE space_id=$1",[common]);
    const expense=await template({name:"  Charge commune  ",section_id:section,card_id:card});
    expect(expense).toMatchObject({name:"Charge commune",currency:"EUR",reminder_offsets:[2,5],user_id:a});
    state.userId=b;
    expect(await expenses.updateExpense(common,expense.id,{name:"Modifiée",card_id:null,notes:"Bob"})).toMatchObject({name:"Modifiée",card_id:null,user_id:a,notes:"Bob"});
    expect((await expenses.getExpenseById(common,expense.id))?.section_id).toBe(section);
    expect((await expenses.getExpenses(common)).some(row=>row.id===expense.id)).toBe(true);
    expect((await expenses.getExpensesByCard(common,card)).some(row=>row.id===expense.id)).toBe(false);
    await expect(expenses.getExpenses(personal)).rejects.toThrow(/inaccessible/);state.userId=a;
    await expect(template({card_id:foreignCard})).rejects.toThrow(/référence/);
    await expect(expenses.updateExpense(common,expense.id,{section_id:foreignSection})).rejects.toThrow(/référence/);
    const privateExpense=await template({},personal);
    expect(await expenses.getExpenseById(common,privateExpense.id)).toBeNull();
    await expect(expenses.deleteExpense(common,privateExpense.id)).rejects.toThrow(/inaccessible/);
  });

  test("generators are concurrent and shared across recurring, one-time, spread and debt templates",async()=>{
    const weekly=await template({recurrence_frequency:"WEEKLY"});
    const biweekly=await template({recurrence_frequency:"BIWEEKLY"});
    const quarterly=await template({recurrence_frequency:"QUARTERLY",amount:90,spread_monthly:true});
    const annual=await template({recurrence_frequency:"YEARLY",amount:120,spread_monthly:false});
    await native.query("UPDATE expenses SET next_due_date='2027-01-10' WHERE id=$1",[annual.id]);
    const once=await template({type:"ONE_TIME",due_date:"2027-01-15"});
    const planned=await template({type:"PLANNED",amount:0});
    const loan=await debt();
    await Promise.all(Array.from({length:4},()=>monthly.generateMonthlyExpenses(common,"2027-01")));
    state.userId=b;
    const rows=await monthly.getMonthlyExpenses(common,"2027-01");
    const forExpense=(id:string)=>rows.filter(row=>row.expense_id===id);
    for(const value of [weekly,biweekly,quarterly,annual,once])expect(forExpense(value.id)).toHaveLength(1);
    expect(Number(forExpense(weekly.id)[0].amount)).toBe(433.33);
    expect(Number(forExpense(biweekly.id)[0].amount)).toBe(216.67);
    expect(Number(forExpense(quarterly.id)[0].amount)).toBe(30);
    expect(forExpense(planned.id)).toHaveLength(0);
    expect(rows.filter(row=>row.debt_id===loan.id)).toHaveLength(1);
    await monthly.generateMonthlyExpenses(common,"2027-02");
    expect((await monthly.getMonthlyExpenses(common,"2027-02")).some(row=>row.expense_id===annual.id||row.expense_id===once.id)).toBe(false);
    state.userId=a;
  });

  test("a queued generator calculates from a newer committed template, not a stale JS snapshot",async()=>{
    const expense=await template({amount:100});
    await native.query("BEGIN");let generated:Promise<void>|undefined;
    try{
      await native.query("UPDATE expenses SET amount=200,auto_debit=true WHERE id=$1",[expense.id]);
      generated=monthly.generateMonthlyExpenses(common,"2027-03");
      await waitForLock("INSERT INTO monthly_expenses");await native.query("COMMIT");await generated;
    }finally{await native.query("ROLLBACK");if(generated)await generated;}
    const found=(await monthly.getMonthlyExpenses(common,"2027-03")).find(row=>row.expense_id===expense.id)!;
    expect(found).toMatchObject({amount:"200.00",is_auto_charged:true});
  });

  test("template edits preserve monthly overrides, paid rows and progressive journals",async()=>{
    const normal=await template();const progressive=await template({is_progressive:true});
    await monthly.generateMonthlyExpenses(common,"2027-04");
    await monthly.generateMonthlyExpenses(common,"2027-05");
    const april=await monthly.getMonthlyExpenses(common,"2027-04");
    const manual=april.find(row=>row.expense_id===normal.id)!;
    const partial=april.find(row=>row.expense_id===progressive.id)!;
    await monthly.updateMonthlyExpenseAmount(common,manual.id,60);
    await transactions.addExpenseTransaction(common,partial.id,25,"Saisie");
    const may=(await monthly.getMonthlyExpenses(common,"2027-05")).find(row=>row.expense_id===normal.id)!;
    await monthly.markAsPaid(common,may.id);
    await expenses.updateExpense(common,normal.id,{amount:200});
    await expenses.updateExpense(common,progressive.id,{amount:300,is_progressive:false});
    expect(await record("monthly_expenses",manual.id)).toMatchObject({amount:"60.00",manually_edited:true});
    expect(await record("monthly_expenses",may.id)).toMatchObject({amount:"100.00",status:"PAID"});
    expect(await record("monthly_expenses",partial.id)).toMatchObject({amount:"100.00",paid_amount:"25.00",is_progressive:true});
    expect(await transactions.getExpenseTransactions(common,partial.id)).toHaveLength(1);
    await expenses.deleteExpense(common,progressive.id);
    expect(await record("monthly_expenses",partial.id)).toBeTruthy();
  });

  test("progressive contributions and journal are atomic, shared and scoped",async()=>{
    const expense=await template({is_progressive:true});await monthly.generateMonthlyExpenses(common,"2027-06");
    const entry=(await monthly.getMonthlyExpenses(common,"2027-06")).find(row=>row.expense_id===expense.id)!;
    state.userId=b;
    await Promise.all(Array.from({length:3},()=>transactions.addExpenseTransaction(common,entry.id,10)));
    expect((await record("monthly_expenses",entry.id)).paid_amount).toBe("30.00");
    expect(await transactions.getExpenseTransactions(common,entry.id)).toHaveLength(3);
    await expect(monthly.markAsPaid(common,entry.id)).rejects.toThrow(/inaccessible/);
    state.userId=a;
    const foreign=await instance(personal,{is_progressive:true});
    await expect(transactions.addExpenseTransaction(common,foreign.id,5)).rejects.toThrow(/inaccessible/);
    expect(await transactions.getExpenseTransactions(common,foreign.id)).toEqual([]);
    await native.query(`CREATE FUNCTION fixture_reject_expense_log() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture journal failure'; END $$`);
    await native.query("CREATE TRIGGER fixture_reject_expense_log BEFORE INSERT ON expense_transactions FOR EACH ROW EXECUTE FUNCTION fixture_reject_expense_log()");
    try{await expect(transactions.addExpenseTransaction(common,entry.id,5)).rejects.toThrow(/fixture journal failure/);}
    finally{await native.query("DROP TRIGGER fixture_reject_expense_log ON expense_transactions");}
    expect((await record("monthly_expenses",entry.id)).paid_amount).toBe("30.00");
  });

  test("manual debt payment is idempotent across two members and reversible once",async()=>{
    const loan=await debt(100,30);const entry=await instance(common,{debt_id:loan.id,amount:30});
    await Promise.all([monthly.markAsPaid(common,entry.id),monthly.markAsPaid(common,entry.id)]);
    expect((await record("debts",loan.id)).remaining_balance).toBe("70.00");expect(await debtLogs(loan.id)).toHaveLength(1);
    state.userId=b;await monthly.markAsPaid(common,entry.id);expect(await debtLogs(loan.id)).toHaveLength(1);
    await Promise.all([monthly.markAsUpcoming(common,entry.id),monthly.markAsUpcoming(common,entry.id)]);
    expect((await record("debts",loan.id)).remaining_balance).toBe("100.00");
    expect((await debtLogs(loan.id)).map(row=>row.type)).toEqual(["PAYMENT","CHARGE"]);
    await monthly.markAsPaid(common,entry.id);expect((await record("debts",loan.id)).remaining_balance).toBe("70.00");state.userId=a;
  });

  test("automatic debt payment logs the actual capped amount exactly once",async()=>{
    const loan=await debt(20,50);const entry=await instance(common,{debt_id:loan.id,amount:50,month:"2001-01",due_date:"2001-01-10",is_auto_charged:true,section_id:section});
    await Promise.all([monthly.autoMarkPaidForAutoDebit(common,"2001-01"),monthly.autoMarkPaidForAutoDebit(common,"2001-01")]);
    expect((await record("debts",loan.id)).remaining_balance).toBe("0.00");
    expect((await debtLogs(loan.id)).map(row=>Number(row.amount))).toEqual([20]);
    expect((await record("monthly_expenses",entry.id)).debt_paid_amount).toBe("20.00");
    expect((await monthly.getMonthSummary(common,"2001-01")).paid_total).toBe(20);
    expect((await monthly.getMonthlyExpenseActualsBySection(common,"2001-01")).find(row=>row.section_id===section)?.total).toBe(20);
    await monthly.markAsUpcoming(common,entry.id);expect((await record("debts",loan.id)).remaining_balance).toBe("20.00");
  });

  test("new debt payment rollback preserves status, balance and journals on failure",async()=>{
    const loan=await debt();const entry=await instance(common,{debt_id:loan.id,amount:30});
    await native.query(`CREATE FUNCTION fixture_reject_debt_log() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture debt failure'; END $$`);
    await native.query("CREATE TRIGGER fixture_reject_debt_log BEFORE INSERT ON debt_transactions FOR EACH ROW EXECUTE FUNCTION fixture_reject_debt_log()");
    try{await expect(monthly.markAsPaid(common,entry.id)).rejects.toThrow(/fixture debt failure/);}
    finally{await native.query("DROP TRIGGER fixture_reject_debt_log ON debt_transactions");}
    expect((await record("debts",loan.id)).remaining_balance).toBe("100.00");
    expect((await record("monthly_expenses",entry.id)).status).toBe("UPCOMING");expect(await debtLogs(loan.id)).toHaveLength(0);
  });

  test("deferral is atomic, idempotent and carries its debt link and explicit space",async()=>{
    const loan=await debt();const entry=await instance(common,{debt_id:loan.id,amount:30,month:"2028-01"});
    await Promise.all([monthly.deferExpenseToMonth(common,entry.id,"2028-02"),monthly.deferExpenseToMonth(common,entry.id,"2028-02")]);
    const forwarded=(await monthly.getMonthlyExpenses(common,"2028-02")).filter(row=>row.debt_id===loan.id);
    expect(forwarded).toHaveLength(1);expect((await record("monthly_expenses",entry.id)).status).toBe("DEFERRED");
    expect((await record("monthly_expenses",forwarded[0].id)).space_id).toBe(common);
    await expect(monthly.deferExpenseToMonth(common,entry.id,"2028-03")).rejects.toThrow(/inaccessible/);
    const conflict=await instance(common,{debt_id:loan.id,amount:30,month:"2028-03"});
    await expect(monthly.deferExpenseToMonth(common,conflict.id,"2028-02")).rejects.toThrow();
    expect((await record("monthly_expenses",conflict.id)).status).toBe("UPCOMING");
    const standalone=await instance(common,{month:"2028-04"});await monthly.deleteMonthlyExpense(common,standalone.id);
    expect(await record("monthly_expenses",standalone.id)).toBeUndefined();
  });

  test("monthly mutations and aggregate reads reject foreign contexts and crossed IDs",async()=>{
    const foreign=await instance(personal);state.userId=b;
    await expect(monthly.getMonthlyExpenses(personal,"2027-01")).rejects.toThrow(/inaccessible/);
    await expect(monthly.generateMonthlyExpenses(personal,"2027-01")).rejects.toThrow(/inaccessible/);
    for(const action of [()=>monthly.markAsPaid(common,foreign.id),()=>monthly.markAsUpcoming(common,foreign.id),
      ()=>monthly.updateMonthlyExpenseAmount(common,foreign.id,1),()=>monthly.deleteMonthlyExpense(common,foreign.id),
      ()=>monthly.deferExpenseToMonth(common,foreign.id,"2027-02")])await expect(action()).rejects.toThrow(/inaccessible/);
    await expect(monthly.createAdhocExpense(common,{name:"Wrong",amount:10,sectionId:foreignSection,month:"2027-01"})).rejects.toThrow(/référence/);state.userId=a;
    expect((await record("monthly_expenses",foreign.id)).status).toBe("UPCOMING");
  });

  test("debt transactions are common, scoped and cap payments at the remaining balance",async()=>{
    const loan=await debt(10);state.userId=b;
    await debtTransactions.addDebtTransaction(common,loan.id,"PAYMENT",20,"2028-05");
    expect((await record("debts",loan.id)).remaining_balance).toBe("0.00");
    expect((await debtTransactions.getDebtTransactions(common,loan.id)).map(row=>Number(row.amount))).toEqual([10]);
    await debtTransactions.addDebtTransaction(common,loan.id,"CHARGE",5,"2028-05");
    expect((await record("debts",loan.id))).toMatchObject({remaining_balance:"5.00",is_active:true});
    expect(await debtTransactions.getMonthlyDebtSummary(common,"2028-05")).toMatchObject({totalPayments:10,totalCharges:5,netMovement:5});
    state.userId=a;
    const foreign=await createDebt(personal,{name:"Privée",original_amount:100,remaining_balance:100,payment_amount:10,payment_frequency:"MONTHLY"});
    await expect(debtTransactions.addDebtTransaction(common,foreign.id,"PAYMENT",1,"2028-05")).rejects.toThrow(/inaccessible/);
    expect(await debtTransactions.getDebtTransactions(common,foreign.id)).toEqual([]);
  });

  test("allocation parents and replacement junctions are scoped and atomic",async()=>{
    const project=await template({type:"PLANNED",amount:0,target_amount:100,saved_amount:0});
    const alloc=await allocations.createAllocation(common,{label:"Épargne",amount:25,section_ids:[section,section2],project_id:project.id});
    state.userId=b;
    expect((await allocations.getAllocations(common)).find(row=>row.id===alloc.id)?.section_ids.sort()).toEqual([section,section2].sort());
    await allocations.updateAllocation(common,alloc.id,{label:"Bob",amount:30,section_ids:[section2]});
    expect((await allocations.getAllocations(common)).find(row=>row.id===alloc.id)).toMatchObject({label:"Bob",amount:"30.00",section_ids:[section2]});
    await expect(allocations.updateAllocation(common,alloc.id,{label:"Bad",amount:1,section_ids:[foreignSection]})).rejects.toThrow(/inaccessible/);
    expect((await allocations.getAllocations(common)).find(row=>row.id===alloc.id)?.label).toBe("Bob");
    await expect(allocations.createAllocation(common,{label:"Bad",amount:1,section_ids:[section,section]})).rejects.toThrow(/distinctes/);
    state.userId=a;
    const privateAlloc=await allocations.createAllocation(personal,{label:"Privé",amount:1});
    await expect(allocations.updateAllocation(common,privateAlloc.id,{label:"Wrong",amount:1,section_ids:[section]})).rejects.toThrow(/inaccessible/);
    await expect(allocations.reorderAllocations(common,[alloc.id,privateAlloc.id])).rejects.toThrow(/inaccessible/);
    await expect(allocations.deleteAllocation(common,privateAlloc.id)).rejects.toThrow(/inaccessible/);
  });

  test("monthly allocations are idempotent, preserve overrides and skip expired or completed goals",async()=>{
    const project=await template({type:"PLANNED",amount:0,target_amount:100,saved_amount:100});
    const completed=await allocations.createAllocation(common,{label:"Objectif atteint",amount:10,project_id:project.id});
    const expired=await allocations.createAllocation(common,{label:"Expiré",amount:10,end_month:"2026-01"});
    const active=await allocations.createAllocation(common,{label:"Budget",amount:20,section_ids:[section]});
    await Promise.all(Array.from({length:3},()=>allocations.generateMonthlyAllocations(common,"2029-01")));
    let rows=await allocations.getMonthlyAllocations(common,"2029-01");
    expect(rows.some(row=>row.allocation_id===completed.id||row.allocation_id===expired.id)).toBe(false);
    expect(rows.filter(row=>row.allocation_id===active.id)).toHaveLength(1);
    const entry=rows.find(row=>row.allocation_id===active.id)!;state.userId=b;
    await allocations.updateMonthlyAllocation(common,entry.id,12,"Exception");
    await allocations.generateMonthlyAllocations(common,"2029-01");rows=await allocations.getMonthlyAllocations(common,"2029-01");
    expect(rows.find(row=>row.id===entry.id)).toMatchObject({allocated_amount:"12.00",notes:"Exception",section_ids:[section]});
    state.userId=a;
    await allocations.createAdhocMonthlyAllocation(common,"2029-02",{label:"Ponctuel",amount:7,section_ids:[section2]});
    expect((await allocations.getMonthlyAllocations(common,"2029-02")).some(row=>row.label==="Ponctuel")).toBe(true);
    await allocations.generateMonthlyAllocations(common,"2029-01");
    expect((await allocations.getMonthlyAllocations(common,"2029-01")).some(row=>row.label==="Ponctuel")).toBe(false);
    await allocations.generateMonthlyAllocations(common,"2029-02");
    expect((await allocations.getMonthlyAllocations(common,"2029-02")).filter(row=>row.label==="Ponctuel")).toHaveLength(1);
    await allocations.generateMonthlyAllocations(common,"2029-03");
    expect((await allocations.getMonthlyAllocations(common,"2029-03")).some(row=>row.label==="Ponctuel")).toBe(false);
  });

  test("all new families require a member, including generators and aggregation",async()=>{
    for(const userId of [c,null]){state.userId=userId;
      for(const action of [()=>expenses.getExpenses(common),()=>monthly.getMonthSummary(common,"2027-01"),
        ()=>transactions.getExpenseTransactions(common,randomUUID()),()=>debtTransactions.getMonthlyDebtSummary(common,"2027-01"),
        ()=>allocations.generateMonthlyAllocations(common,"2027-01"),()=>allocations.getAllocations(common)])await expect(action()).rejects.toThrow();
    }state.userId=a;
    expect((await getDebts(common)).every(row=>(row as unknown as {space_id:string}).space_id===common)).toBe(true);
  });

  test("an unplanned expense becomes planned only in its deferred future month",async()=>{
    const entry=await instance(common,{month:"2030-01",amount:13,is_planned:false});
    await monthly.deferExpenseToMonth(common,entry.id,"2030-02");
    const target=(await monthly.getMonthlyExpenses(common,"2030-02"))[0];
    expect(target).toMatchObject({is_planned:true,amount:"13.00"});
    expect((await record("monthly_expenses",entry.id)).is_planned).toBe(false);
    expect(await monthly.getMonthSummary(common,"2030-02")).toMatchObject({planned_total:13,unplanned_total:0});
  });

  test("failed stale-instance cleanup rolls back the edited expense too",async()=>{
    const expense=await template();await monthly.generateMonthlyExpenses(common,"2030-03");
    await native.query(`CREATE FUNCTION fixture_reject_cleanup() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture cleanup failure'; END $$`);
    await native.query("CREATE TRIGGER fixture_reject_cleanup BEFORE DELETE ON monthly_expenses FOR EACH ROW EXECUTE FUNCTION fixture_reject_cleanup()");
    try{await expect(expenses.updateExpense(common,expense.id,{amount:999})).rejects.toThrow(/fixture cleanup failure/);}
    finally{await native.query("DROP TRIGGER fixture_reject_cleanup ON monthly_expenses");}
    expect((await expenses.getExpenseById(common,expense.id))?.amount).toBe("100.00");
    expect((await monthly.getMonthlyExpenses(common,"2030-03")).some(row=>row.expense_id===expense.id)).toBe(true);
  });

  test("failed allocation junction replacement rolls back metadata and old links",async()=>{
    const alloc=await allocations.createAllocation(common,{label:"Avant",amount:11,section_ids:[section]});
    await native.query(`CREATE FUNCTION fixture_reject_links() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture link failure'; END $$`);
    await native.query("CREATE TRIGGER fixture_reject_links BEFORE INSERT ON allocation_sections FOR EACH ROW EXECUTE FUNCTION fixture_reject_links()");
    try{await expect(allocations.updateAllocation(common,alloc.id,{label:"Après",amount:999,section_ids:[section2]})).rejects.toThrow(/fixture link failure/);}
    finally{await native.query("DROP TRIGGER fixture_reject_links ON allocation_sections");}
    expect((await allocations.getAllocations(common)).find(row=>row.id===alloc.id)).toMatchObject({label:"Avant",amount:"11.00",section_ids:[section]});
    await allocations.reorderAllocations(common,[alloc.id]);
    await allocations.deleteAllocation(common,alloc.id);
    expect((await allocations.getAllocations(common)).some(row=>row.id===alloc.id)).toBe(false);
  });

  test("payment and reversal keep a debt explicitly archived with an outstanding balance inactive",async()=>{
    const loan=await debt();const entry=await instance(common,{debt_id:loan.id,amount:30});
    await deleteDebt(common,loan.id);
    await monthly.markAsPaid(common,entry.id);
    expect(await record("debts",loan.id)).toMatchObject({remaining_balance:"70.00",is_active:false});
    await monthly.markAsUpcoming(common,entry.id);
    expect(await record("debts",loan.id)).toMatchObject({remaining_balance:"100.00",is_active:false});
    await debtTransactions.addDebtTransaction(common,loan.id,"CHARGE",5,"2029-01");
    expect(await record("debts",loan.id)).toMatchObject({remaining_balance:"105.00",is_active:false});
    const zero=await debt(20,20);const finalPayment=await instance(common,{debt_id:zero.id,amount:20});
    await deleteDebt(common,zero.id);await monthly.markAsPaid(common,finalPayment.id);
    expect(await record("debts",zero.id)).toMatchObject({remaining_balance:"0.00",is_active:false});
    await monthly.markAsUpcoming(common,finalPayment.id);
    expect(await record("debts",zero.id)).toMatchObject({remaining_balance:"20.00",is_active:false});
    await debtTransactions.addDebtTransaction(common,zero.id,"CHARGE",5,"2029-01");
    expect(await record("debts",zero.id)).toMatchObject({remaining_balance:"25.00",is_active:false});
  });

  test("one-time due-date edits and conversion to a planned project refresh only future unsaved instances",async()=>{
    const once=await template({type:"ONE_TIME",due_date:"2031-01-10"});
    await monthly.generateMonthlyExpenses(common,"2031-01");
    await expenses.updateExpense(common,once.id,{due_date:"2031-02-20"});
    expect((await monthly.getMonthlyExpenses(common,"2031-01")).some(row=>row.expense_id===once.id)).toBe(false);
    await monthly.generateMonthlyExpenses(common,"2031-02");
    const feb=(await monthly.getMonthlyExpenses(common,"2031-02")).find(row=>row.expense_id===once.id)!;
    expect(String((await record("monthly_expenses",feb.id)).due_date).includes("2031")).toBe(true);
    const nextDueValue = (await expenses.getExpenseById(common,once.id))?.next_due_date;
    expect(nextDueValue).toBeTruthy();
    const nextDueDate = new Date(nextDueValue!);
    expect([nextDueDate.getFullYear(), nextDueDate.getMonth() + 1, nextDueDate.getDate()]).toEqual([2031, 2, 20]);
    await expenses.updateExpense(common,once.id,{type:"PLANNED"});
    expect((await monthly.getMonthlyExpenses(common,"2031-02")).some(row=>row.expense_id===once.id)).toBe(false);
    await monthly.generateMonthlyExpenses(common,"2031-02");
    expect((await monthly.getMonthlyExpenses(common,"2031-02")).some(row=>row.expense_id===once.id)).toBe(false);
  });

  test("an unverifiable historical debt reversal returns an explicit safe result without changing money or history",async()=>{
    state.userId=a;
    const loan=await debt(70,30);
    const payment=await instance(common,{debt_id:loan.id,amount:30,status:"PAID",debt_paid_amount:null});
    const before=await record("debts",loan.id),logs=await debtLogs(loan.id);
    expect(await monthly.markAsUpcoming(common,payment.id)).toMatchObject({ok:false,error:expect.stringContaining("invérifiable")});
    expect(await record("debts",loan.id)).toEqual(before);
    expect(await debtLogs(loan.id)).toEqual(logs);
    expect(await record("monthly_expenses",payment.id)).toEqual(payment);
  });
});
