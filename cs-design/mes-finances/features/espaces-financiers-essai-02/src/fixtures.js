export const MONTH='2026-10';
export const people={camille:{id:'camille',name:'Camille Martin',email:'camille@example.test'},alex:{id:'alex',name:'Alex Tremblay',email:'alex@example.test'}};
export const categories=[{id:'home',name:'Maison',icon:'🏠',color:'#0F766E',position:0},{id:'personal',name:'Perso',icon:'👤',color:'#7C3AED',position:1},{id:'food',name:'Épicerie',icon:'🛒',color:'#D97706',position:2}];
export function emptySpace(id,name,members=['camille']){return {id,name,members,sections:categories.map(c=>({...c})),cards:[],templates:[],incomeTemplates:[],guide:true,expenses:[],incomes:[],allocations:[],projects:[],debts:[],freeSavings:{id:id+'-free',name:'Épargne libre',type:'PLANNED',saved_amount:0,is_active:true,target_amount:null,target_date:null,amount:0},currency:'CAD'};}
function expense(id,name,amount,section,status='UPCOMING',planned=true){return {id,name,amount,section_id:section.id,section,month:MONTH,status,due_date:MONTH+'-25',expense_id:planned?id+'-template':null,is_planned:planned,is_progressive:false,paid_amount:status==='PAID'?amount:0,created_at:MONTH+'-01',paid_at:status==='PAID'?MONTH+'-01':null};}
function income(id,name,amount){return {id,income_id:id+'-template',income_name:name,income_source:'EMPLOYMENT',income_frequency:'MONTHLY',expected_amount:amount,actual_amount:amount,status:'RECEIVED',month:MONTH,received_at:MONTH+'-01'};}
export function initialState(scenario='couple'){
 const personal=emptySpace('personal','Mes finances');
 personal.expenses=[expense('pers-1','Abonnement musique',10.99,categories[1],'PAID'),expense('pers-2','Transport',96,categories[1])];personal.incomes=[income('pers-income','Salaire — Camille',3400)];personal.freeSavings.saved_amount=1250;personal.guide=false;
 const couple=emptySpace('couple','Notre couple',['camille','alex']);
 couple.expenses=[expense('couple-1','Loyer',1450,categories[0],'PAID'),expense('couple-2','Épicerie',400,categories[2]),expense('couple-3','Pain et viennoiseries',3.99,categories[2],'PAID',false)];couple.incomes=[income('couple-income1','Contribution — Camille',1800),income('couple-income2','Contribution — Alex',1600)];couple.freeSavings.saved_amount=2800;couple.guide=false;
 couple.allocations=[{id:'envelope-home',allocation_id:'a1',label:'Maison',allocated_amount:1450,color:'#0F766E',position:0,section_ids:['home'],sections:[categories[0]],project_id:null,end_month:null},{id:'envelope-food',allocation_id:'a2',label:'Épicerie',allocated_amount:500,color:'#D97706',position:1,section_ids:['food'],sections:[categories[2]],project_id:null,end_month:null}];
 const invitation={id:'invite1',spaceId:'couple',spaceName:'Notre couple',from:'Camille Martin',to:'alex@example.test',status:'pending'};
 let state={user:'camille',spaces:[personal,couple],active:'couple',invitations:[],lastAccepted:null};
 if(scenario==='solo')state={...state,spaces:[personal],active:'personal'};
 if(scenario==='empty')state={...state,spaces:[emptySpace('personal','Mes finances')],active:'personal'};
 if(scenario==='long')state.spaces[1].name='Notre espace familial et projets de vie à deux';
 if(scenario==='invite'||scenario==='signup') state={...state,user:'alex',spaces:scenario==='invite'?[{...personal,id:'alex-personal',name:'Mes finances',members:['alex']}, {...couple,members:['camille']}]:[{...couple,members:['camille']}],active:scenario==='invite'?'alex-personal':null,invitations:[invitation]};
 if(scenario==='onboarding')state={...state,spaces:[],active:null};
 return state;
}
export function summaryOf(expenses){const paid=expenses.filter(x=>x.status==='PAID');return {count:expenses.length,total:expenses.reduce((s,x)=>s+Number(x.amount),0),planned_total:expenses.filter(x=>x.is_planned).reduce((s,x)=>s+Number(x.amount),0),unplanned_total:expenses.filter(x=>!x.is_planned).reduce((s,x)=>s+Number(x.amount),0),paid_count:paid.length,paid_total:paid.reduce((s,x)=>s+Number(x.amount),0),overdue_count:0};}
