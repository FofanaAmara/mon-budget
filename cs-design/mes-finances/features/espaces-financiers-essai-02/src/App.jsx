import React,{useState,useEffect,useLayoutEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import AuthPage from '@/app/auth/[path]/page';
import LayoutShell from '@/components/LayoutShell';
import AccueilClient from '@/components/AccueilClient';
import DepensesTrackingClient from '@/components/DepensesTrackingClient';
import RevenusTrackingClient from '@/components/RevenusTrackingClient';
import ProjetsEpargneClient from '@/components/ProjetsEpargneClient';
import ParametresClient from '@/components/ParametresClient';
import ExpenseTemplateManager from '@/components/ExpenseTemplateManager';
import IncomeTemplateManager from '@/components/IncomeTemplateManager';
import AllocationsManager from '@/components/AllocationsManager';
import SectionsClient from '@/components/SectionsClient';
import CartesClient from '@/components/CartesClient';
import NotificationsClient from '@/components/parametres/NotificationsClient';
import RappelsClient from '@/components/parametres/RappelsClient';
import DeviseClient from '@/components/parametres/DeviseClient';
import OnboardingCarousel from '@/components/onboarding/OnboardingCarousel';
import SheetCloseButton from '@/components/SheetCloseButton';
import {PreviewNavigation} from '../mocks/navigation.jsx';
import {PreviewIdentity} from '../mocks/auth.jsx';
import {setServiceHandler} from '../mocks/services.jsx';
import {MONTH,people,categories,emptySpace,initialState,summaryOf} from './fixtures.js';

const KEY='mes-finances-mockups-react-v2';
const zeroSavings={totalContributions:0,contributionCount:0,byProject:[]};
const zeroDebt={totalPayments:0,totalCharges:0,netMovement:0,paymentCount:0,chargeCount:0};
const scenarioNames={couple:'Couple + personnel',solo:'Un seul espace',empty:'Compte existant vide',onboarding:'Premier espace',invite:'Invitation — compte existant',signup:'Invitation — nouveau compte',long:'Nom long'};
function readStart(){try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved)return saved;}catch{}return initialState();}
function readEntry(){
 const params=new URLSearchParams(window.location.search);
 const requested=params.get('scenario');
 if(requested&&Object.hasOwn(scenarioNames,requested))return {
  state:initialState(requested),scene:requested,
  url:requested==='invite'?'/invitations':window.location.pathname,
  mode:requested==='onboarding'?'onboarding':requested==='signup'?'signup':'app',
  overlay:params.get('dialog')==='create'?'create':null,
 };
 let view={};try{view=JSON.parse(localStorage.getItem(KEY+'-view'))||{};}catch{}
 return {state:readStart(),scene:view.scene||'couple',url:view.url||'/',mode:view.mode||'app',overlay:null};
}
function groupIncome(space){return {expectedTotal:space.incomes.reduce((n,x)=>n+Number(x.expected_amount||0),0),actualTotal:space.incomes.reduce((n,x)=>n+Number(x.actual_amount||0),0)};}

function Sheet({title,children,onClose}){
 const el=useRef(null);
 useEffect(()=>{const before=document.activeElement;el.current?.focus();const prior=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=prior;before?.focus?.();};},[]);
 return <div className="sheet-backdrop" style={{zIndex:160}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><section ref={el} className="sheet space-sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onKeyDown={e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const controls=[...el.current.querySelectorAll('button:not(:disabled),input,select,a[href]')];const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}}><div className="sheet-handle"/><SheetCloseButton onClose={onClose}/><h2>{title}</h2>{children}</section></div>;
}
function SpaceForm({first=false,onCreate,onCancel}){
 const [name,setName]=useState(first?'Mes finances':'');const [email,setEmail]=useState('');const [error,setError]=useState('');const [stage,setStage]=useState(0);
 function next(e){e.preventDefault();if(!name.trim()){setError('Donne un nom à ton espace.');return;}setError('');setStage(1);}
 function submit(e){e.preventDefault();if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setError('Vérifie le courriel de la personne à inviter.');return;}onCreate(name.trim(),email.trim().toLowerCase());}
 return <><div className="space-progress" aria-label={`Étape ${stage+1} sur 2`}><i className="active"/><i className={stage===1?'active':''}/></div>{stage===0?<form onSubmit={next}><p className="space-copy">{first?'Un espace pour tes finances, ou celles que tu partages. Tu pourras en créer d’autres plus tard.':'Tes données restent séparées de celles des autres espaces.'}</p><label className="space-label" htmlFor="space-name">NOM DE L’ESPACE</label><input id="space-name" maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Ex. Notre couple" autoFocus/><p className="space-hint">Choisis un nom qui te ressemble. Tu pourras le modifier.</p>{error&&<p className="space-error" role="alert">{error}</p>}<div className="space-footer">{onCancel&&<button type="button" className="space-btn secondary" onClick={onCancel}>Annuler</button>}<button className="space-btn">Continuer</button></div></form>:<form onSubmit={submit}><div className="space-context">{name}</div><h3>À plusieurs, si tu veux.</h3><p className="space-copy">Invite ton conjoint ou une autre personne. Chaque membre pourra tout gérer, comme toi.</p><label className="space-label" htmlFor="invite-create">COURRIEL À INVITER <span>facultatif</span></label><input id="invite-create" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="alex@exemple.ca"/><p className="space-hint">Tu peux aussi inviter quelqu’un plus tard.</p>{error&&<p className="space-error" role="alert">{error}</p>}<div className="space-footer"><button type="button" className="space-btn secondary" onClick={()=>setStage(0)}>Retour</button><button className="space-btn">{email?'Créer et inviter':'Créer mon espace'}</button></div></form>}</>;
}
function SidebarSelector({spaces,active,onSwitch,onCreate,onManage,onInvites,count}){
 
 return <div className="space-selector"><label htmlFor="active-space">ESPACE FINANCIER</label>{!active?<p className="space-hint">Aucun espace ouvert</p>:<select id="active-space" aria-label="Espace financier actif" value={active||''} onChange={e=>onSwitch(e.target.value)} disabled={spaces.length<=1}>{spaces.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>}{spaces.length===1&&active&&<p className="space-only">Ton seul espace pour le moment.</p>}<button className="space-selector-link" onClick={onManage}>Espace et membres <span>→</span></button><button className="space-selector-link" onClick={onCreate}>＋ Créer un espace</button><button className="space-selector-link" onClick={onInvites}>Invitations <span className={count?'space-count':''}>{count}</span></button></div>;
}
function ShellAdditions({state,onSwitch,onCreate,onManage,onInvites,count,route}){
 const [host,setHost]=useState(null);const [settingsHost,setSettingsHost]=useState(null);const [drawer,setDrawer]=useState(false);const drawerRef=useRef(null);
 useEffect(()=>{if(!drawer)return;const prev=document.activeElement;drawerRef.current?.focus();const fn=e=>{if(e.key==='Escape')setDrawer(false);if(e.key==='Tab'){const nodes=[...drawerRef.current.querySelectorAll('button,select:not(:disabled)')];if(e.shiftKey&&document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0]?.focus();}}};document.addEventListener('keydown',fn);const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.removeEventListener('keydown',fn);document.body.style.overflow=overflow;prev?.focus?.();};},[drawer]);
 const accessible=state.spaces.filter(s=>s.members.includes(state.user));const active=accessible.find(s=>s.id===state.active);
 useLayoutEffect(()=>{const aside=document.querySelector('aside.hidden');if(!aside)return;const mount=document.createElement('div');aside.insertBefore(mount,aside.children[1]);setHost(mount);return()=>mount.remove();},[]);
 useLayoutEffect(()=>{setSettingsHost(null);if(route!=='/parametres')return;const card=document.querySelector('.list-card');if(!card)return;const mount=document.createElement('div');card.parentNode.insertBefore(mount,card);setSettingsHost(mount);return()=>mount.remove();},[route]);
 const selector=<SidebarSelector spaces={accessible} active={state.active} onSwitch={id=>{onSwitch(id);setDrawer(false);}} onCreate={()=>{setDrawer(false);onCreate();}} onManage={()=>{setDrawer(false);onManage();}} onInvites={()=>{setDrawer(false);onInvites();}} count={count}/>;
 return <>{host&&createPortal(selector,host)}<div className="space-mobile-bar"><button onClick={()=>setDrawer(true)} aria-label="Ouvrir la sidebar des espaces"><span className="space-mini-icon">▱</span><span>{active?.name||'Choisir un espace'}</span><span aria-hidden="true">⌄</span></button>{count>0&&<button className="space-invite-dot" onClick={onInvites} aria-label={`${count} invitation en attente`}><span aria-hidden="true">{count}</span></button>}</div>{drawer&&<div className="space-drawer-backdrop" onClick={e=>{if(e.target===e.currentTarget)setDrawer(false);}}><aside ref={drawerRef} tabIndex={-1} role="dialog" aria-modal="true" className="space-drawer" aria-label="Espaces financiers"><div className="space-drawer-heading"><strong>Tes espaces</strong><button onClick={()=>setDrawer(false)} aria-label="Fermer la sidebar">×</button></div>{selector}<p className="space-copy" style={{padding:'0 20px'}}>Chaque espace a ses finances. Seuls ses membres y ont accès.</p></aside></div>}{settingsHost&&createPortal(<button className="space-settings-row" onClick={onManage}><span className="space-mini-icon">▱</span><span><strong>Espace et membres</strong><small>{active?.name}</small></span><span>›</span></button>,settingsHost)}</>;
}
function InvitationScreen({state,pending,onAccept,onOpen,onDecline}){
 return <div className="space-page"><p className="space-eyebrow">INVITATIONS</p><h1>À gérer ensemble.</h1><p className="space-copy">Un espace partagé, les mêmes droits pour chaque membre.</p>{pending.map(inv=><article className="space-card" key={inv.id}><div className="space-badge">Invitation en attente</div><h2>{inv.spaceName}</h2><p className="space-copy">{inv.from} t’invite à rejoindre cet espace financier.</p><p className="space-info">En acceptant, tu pourras voir et gérer toutes ses finances, inviter des personnes et modifier l’espace.</p><button className="space-btn" onClick={()=>onAccept(inv)}>Accepter l’invitation</button><button className="space-text-btn" onClick={()=>onDecline(inv)}>Refuser</button></article>)}{state.lastAccepted&&<article className="space-card" role="status"><div className="space-badge">✓ Invitation acceptée</div><h2>Tu fais partie de {state.lastAccepted.name}.</h2><p className="space-copy">Tu peux maintenant contribuer, comme tous les membres.</p><button className="space-btn" onClick={()=>onOpen(state.lastAccepted.id)}>Ouvrir cet espace</button></article>}{!pending.length&&!state.lastAccepted&&<div className="space-empty"><span>✉</span><h2>Aucune invitation en attente</h2><p className="space-copy">Les invitations reçues apparaîtront ici.</p></div>}</div>;
}
function Management({space,state,onRename,onInvite,onBack}){
 const [editing,setEditing]=useState(false);const [name,setName]=useState(space.name);const [email,setEmail]=useState('');const [error,setError]=useState('');const [sent,setSent]=useState('');
 const outbound=state.invitations.filter(i=>i.spaceId===space.id&&i.status==='pending');
 function send(e){e.preventDefault();const to=email.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)){setError('Entre un courriel valide.');return;}if(space.members.some(id=>people[id]?.email===to)){setError('Cette personne est déjà membre de cet espace.');return;}if(outbound.some(i=>i.to===to)){setError('Une invitation est déjà en attente pour ce courriel.');return;}onInvite(to);setSent(to);setEmail('');setError('');}
 return <div className="space-page"><button className="space-back" onClick={onBack}>‹ Réglages</button><p className="space-eyebrow">ESPACE ET MEMBRES</p><h1>{space.name}</h1><p className="space-copy">Toutes les finances de cet espace, au même endroit.</p><section className="space-card"><div className="space-row"><h2>Nom de l’espace</h2><button className="space-text-btn" onClick={()=>{setName(space.name);setEditing(v=>!v);}}>Modifier</button></div>{editing?<form onSubmit={e=>{e.preventDefault();if(name.trim()){onRename(name.trim());setEditing(false);}}}><label className="space-label" htmlFor="rename">NOM DE L’ESPACE</label><input id="rename" value={name} maxLength={80} onChange={e=>setName(e.target.value)} autoFocus/><button className="space-btn" style={{marginTop:12}}>Enregistrer</button></form>:<p>{space.name}</p>}</section><section className="space-card"><h2>Membres ({space.members.length})</h2><p className="space-copy">Tout le monde a les mêmes droits : finances, invitations et gestion de l’espace.</p>{space.members.map(id=><div className="space-member" key={id}><span className="space-avatar">{(people[id]?.name||id).split(' ').map(p=>p[0]).slice(0,2).join('')}</span><div><strong>{people[id]?.name||id}{id===state.user?' (toi)':''}</strong><small>{people[id]?.email||'Membre invité'}</small></div><span className="space-member-label">Membre</span></div>)}</section><section className="space-card"><h2>Inviter une personne</h2><p className="space-copy">Elle recevra une invitation par courriel et pourra l’accepter depuis son compte.</p><form onSubmit={send}><label className="space-label" htmlFor="invite-manage">COURRIEL</label><input id="invite-manage" type="email" placeholder="alex@exemple.ca" value={email} onChange={e=>{setEmail(e.target.value);setError('');}}/>{error&&<p className="space-error" role="alert">{error}</p>}<button className="space-btn" style={{marginTop:14}}>Envoyer l’invitation</button></form>{sent&&<p className="space-feedback" role="status">Invitation simulée pour {sent}. Aucun courriel envoyé.</p>}{outbound.length>0&&<><p className="space-eyebrow" style={{marginTop:24}}>EN ATTENTE ({outbound.length})</p>{outbound.map(i=><div className="space-member" key={i.id}><div><strong>{i.to}</strong><small>En attente d’acceptation</small></div></div>)}</>}</section></div>;
}

export default function App(){
 const [entry]=useState(readEntry);
 const [state,setState]=useState(entry.state);const [url,setUrl]=useState(entry.url);const [scene,setScene]=useState(entry.scene);const [overlay,setOverlay]=useState(entry.overlay);const [mode,setMode]=useState(entry.mode);const [toast,setToast]=useState('');const [previewMenu,setPreviewMenu]=useState(false);const [revision,setRevision]=useState(0);
 const toastTimer=useRef(null);
 function notify(text){setToast(text);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),5000);}
 const active=state.spaces.find(s=>s.id===state.active&&s.members.includes(state.user));
 const user=people[state.user]||people.camille;
 const incoming=state.invitations.filter(i=>i.status==='pending'&&i.to===user.email);
 const parsed=new URL(url,'http://preview.local');const route=parsed.pathname;const month=parsed.searchParams.get('month')||MONTH;
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(state)),[state]);
 useEffect(()=>localStorage.setItem(KEY+'-view',JSON.stringify({url,mode,scene})),[url,mode,scene]);
 function navigate(href){setUrl(href);setOverlay(null);window.scrollTo({top:0});}
 const router={push:navigate,replace:navigate,refresh:()=>setRevision(v=>v+1),back:()=>navigate('/parametres'),prefetch:()=>Promise.resolve()};
 useEffect(()=>{const fn=e=>{if(e.detail==='/preview/accept-invitation'){setMode('app');navigate('/invitations');}else navigate(e.detail);};window.addEventListener('preview:navigate',fn);return()=>window.removeEventListener('preview:navigate',fn);},[]);
 function changeActive(id){if(id===state.active)return;const hasDraft=document.querySelector('[role="dialog"] input');if(hasDraft&&!confirm('Une saisie est en cours. La fermer et changer d’espace ?'))return;setState(s=>({...s,active:id,lastAccepted:null}));notify(`Espace actif : ${state.spaces.find(x=>x.id===id)?.name}`);setOverlay(null);}
 function updateSpace(fn){setState(s=>({...s,spaces:s.spaces.map(x=>x.id===s.active?fn(x):x)}));}
 function reset(next){setScene(next);setState(initialState(next));setOverlay(null);setToast('');setUrl(next==='invite'?'/invitations':'/');setMode(next==='onboarding'?'onboarding':next==='signup'?'signup':'app');setPreviewMenu(false);window.scrollTo({top:0});}
 function createSpace(name,email){const id='space-'+Date.now();const invitation=email?{id:'invite-'+Date.now(),spaceId:id,spaceName:name,to:email,from:user.name,status:'pending'}:null;setState(s=>({...s,spaces:[...s.spaces,emptySpace(id,name,[s.user])],active:id,invitations:invitation?[...s.invitations,invitation]:s.invitations,lastAccepted:null}));setMode('app');setOverlay(null);navigate('/');notify(email?'Espace créé. Invitation simulée, aucun courriel envoyé.':'Ton espace est prêt.');}
 function accept(inv){const space=state.spaces.find(s=>s.id===inv.spaceId);setState(s=>({...s,spaces:s.spaces.map(x=>x.id===inv.spaceId?{...x,members:[...new Set([...x.members,s.user])]}:x),invitations:s.invitations.map(i=>i.id===inv.id?{...i,status:'accepted'}:i),lastAccepted:{id:inv.spaceId,name:space?.name||inv.spaceName}}));notify('Invitation acceptée.');}
 setServiceHandler((name,args)=>{
  if(name.startsWith('get'))return [];
  const first=args[0];const data=typeof first==='object'?first:{};const id='mock-'+Date.now();
  if(name==='createAdhocExpense'){updateSpace(s=>({...s,expenses:[...s.expenses,{id,name:data.name,amount:data.amount,section_id:data.sectionId,section:categories.find(c=>c.id===data.sectionId),month:data.month,status:data.alreadyPaid?'PAID':'UPCOMING',paid_amount:data.alreadyPaid?data.amount:0,is_planned:false,is_progressive:false,due_date:data.dueDate||MONTH+'-23',created_at:MONTH+'-22'}]}));notify(`Dépense ajoutée dans ${active.name}.`);return {id};}
  if(name==='markAsPaid'||name==='markAsUpcoming'){updateSpace(s=>({...s,expenses:s.expenses.map(x=>x.id===first?{...x,status:name==='markAsPaid'?'PAID':'UPCOMING',paid_amount:name==='markAsPaid'?x.amount:0}:x)}));return;}
  if(name==='createAdhocIncome'){updateSpace(s=>({...s,incomes:[...s.incomes,{id,income_id:null,income_name:first,income_source:args[2],expected_amount:args[1],actual_amount:args[1],status:'RECEIVED',month:args[3]}]}));notify(`Revenu ajouté dans ${active.name}.`);return {id};}
  if(name==='updateMonthlyAllocation'){updateSpace(s=>({...s,allocations:s.allocations.map(x=>x.id===first?{...x,...args[1]}:x)}));return;}
  if(name==='addSavingsContribution'||name==='addSavings'){const amount=Number(args[1]||data.amount||0);updateSpace(s=>({...s,freeSavings:{...s.freeSavings,saved_amount:s.freeSavings.saved_amount+amount}}));notify('Épargne mise à jour dans cet espace (simulation).');return {id};}
  if(name==='dismissSetupGuide'||name==='completeSetupGuide'){updateSpace(s=>({...s,guide:false}));return;}
  if(name==='resetSetupGuide'){updateSpace(s=>({...s,guide:true}));return;}
  if(name==='updateSettings'){updateSpace(s=>({...s,currency:args[1]?.default_currency||s.currency}));return;}
  notify('Action simulée. Le service réel sera branché à l’intégration.');return {success:true,id,loaded:0};
 });
 let page;
 if(mode==='onboarding')page=<div className="space-onboarding"><div className="space-onboarding-inner"><p className="space-eyebrow">BIENVENUE DANS MES FINANCES</p><h1>Ton premier<br/>espace financier.</h1><SpaceForm first onCreate={createSpace}/></div></div>;
 else if(mode==='signup')page=<div className="preview-auth"><AuthPage params={{path:'sign-up'}}/></div>;
 else if(mode==='guide')page=<OnboardingCarousel onComplete={()=>{setMode('app');notify('Guide terminé dans la maquette.');}} onSkip={()=>setMode('app')}/>;
 else {
  if(route==='/invitations'||!active)page=<InvitationScreen state={state} pending={incoming} onAccept={accept} onOpen={id=>{setState(s=>({...s,active:id,lastAccepted:null}));navigate('/');}} onDecline={inv=>{setState(s=>({...s,invitations:s.invitations.map(i=>i.id===inv.id?{...i,status:'declined'}:i)}));notify('Invitation refusée.');}}/>;
  else if(route==='/parametres/espace')page=<Management key={active.id} space={active} state={state} onRename={name=>{updateSpace(s=>({...s,name}));notify('Nom de l’espace enregistré.');}} onInvite={email=>{setState(s=>({...s,invitations:[...s.invitations,{id:'invite-'+Date.now(),spaceId:active.id,spaceName:active.name,to:email,from:user.name,status:'pending'}]}));}} onBack={()=>navigate('/parametres')}/>;
  else {
   const expenses=active.expenses.filter(x=>x.month===month);const incomes=active.incomes.filter(x=>x.month===month);const summary=summaryOf(expenses);const incomeSummary=groupIncome({...active,incomes});const shared={sections:active.sections||categories,cards:active.cards||[]};
   if(route==='/')page=<AccueilClient summary={summary} incomeSummary={incomeSummary} expenses={expenses} monthlyIncomes={incomes} month={month} monthlyIncomeFromTemplates={incomeSummary.expectedTotal} totalMonthlyExpenses={summary.planned_total} projets={[active.freeSavings,...active.projects]} totalDebtBalance={0} savingsSummary={zeroSavings} debtSummary={zeroDebt}/>;
   else if(route==='/depenses')page=<DepensesTrackingClient expenses={expenses} summary={summary} {...shared} month={month}/>;
   else if(route==='/revenus')page=<RevenusTrackingClient monthlyIncomes={incomes} incomeSummary={incomeSummary} allIncomes={[]} month={month} monthlyAllocations={active.allocations} sectionActuals={categories.map(c=>({section_id:c.id,total:expenses.filter(x=>x.section_id===c.id&&x.status==='PAID').reduce((n,x)=>n+x.amount,0)}))} {...shared} projects={active.projects}/>;
   else if(route==='/projets')page=<ProjetsEpargneClient projets={active.projects} {...shared} freeSavings={active.freeSavings} debts={active.debts} totalDebtBalance={0}/>;
   else if(route==='/parametres')page=<ParametresClient hasData={!!active.expenses.length}/>;
   else if(route==='/parametres/charges')page=<ExpenseTemplateManager expenses={active.templates||[]} {...shared}/>;
   else if(route==='/parametres/revenus')page=<IncomeTemplateManager incomes={active.incomeTemplates||[]}/>;
   else if(route==='/parametres/allocation'||route==='/allocations')page=<AllocationsManager allocations={active.allocations.map(x=>({...x,amount:x.allocated_amount}))} {...shared} projects={active.projects} expectedMonthlyIncome={incomeSummary.expectedTotal}/>;
   else if(route==='/sections')page=<SectionsClient sections={active.sections||categories}/>;
   else if(route==='/cartes')page=<CartesClient cards={active.cards||[]}/>;
   else if(route==='/parametres/devise')page=<DeviseClient key={active.id} settingsId={active.id} currentCurrency={active.currency}/>;
   else if(route==='/parametres/notifications')page=<NotificationsClient settingsId={active.id} currentEmail={user.email} currentPhone="" currentNotifyPush={false} currentNotifyEmail={false}/>;
   else if(route==='/parametres/rappels')page=<RappelsClient settingsId={active.id} currentReminders={[1,3]}/>;
   else page=<div className="space-page"><button className="space-back" onClick={()=>navigate('/parametres')}>‹ Réglages</button><h1>Réglage existant</h1><p className="space-copy">Cette surface ne change pas avec la feature. Son service sera rebranché à l’intégration.</p></div>;
  }
  page=<LayoutShell key={state.user+'-'+state.active} guideData={active?.guide?{isVisible:true,isCompleted:false,stepsCompletion:{income:active.incomes.length>0,expense:active.expenses.some(x=>x.is_planned),generate:true,pay:active.expenses.some(x=>x.status==='PAID')}}:null}><div key={state.active+'-'+route} className={"space-product-content "+(route==='/revenus'?'preview-revenus':'')}>{incoming.length>0&&route!=='/invitations'&&<button className="space-invitation-banner" onClick={()=>navigate('/invitations')}>✉ Tu as {incoming.length} invitation en attente <span>Voir →</span></button>}{page}</div><ShellAdditions state={state} route={route} onSwitch={changeActive} onCreate={()=>setOverlay('create')} onManage={()=>navigate('/parametres/espace')} onInvites={()=>navigate('/invitations')} count={incoming.length}/></LayoutShell>;
 }
 return <PreviewIdentity.Provider value={user}><PreviewNavigation.Provider value={{router,pathname:route,search:parsed.searchParams}}>{page}{overlay==='create'&&<Sheet title="Créer un espace" onClose={()=>setOverlay(null)}><SpaceForm onCreate={createSpace} onCancel={()=>setOverlay(null)}/></Sheet>}{toast&&<div className="space-toast" role="status">{toast}</div>}<div className="preview-tools"><button onClick={()=>setPreviewMenu(v=>!v)} aria-expanded={previewMenu}>Maquette React · Démo</button>{previewMenu&&<div className="preview-tools-menu"><strong>Données fictives · aucun envoi réel</strong><label htmlFor="scenario">Recommencer un parcours</label><select id="scenario" value={scene} onChange={e=>reset(e.target.value)}>{Object.entries(scenarioNames).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select><button onClick={()=>reset(scene)}>Réinitialiser ce scénario</button><button onClick={()=>{setState(s=>({...s,user:s.user==='camille'?'alex':'camille',active:s.spaces.find(x=>x.members.includes(s.user==='camille'?'alex':'camille'))?.id||null}));setMode('app');navigate('/invitations');setPreviewMenu(false);}}>Jouer l’autre membre du couple</button><button onClick={()=>{setPreviewMenu(false);setMode('guide');}}>Voir le guide actuel</button><small>Les données et l’acceptation sont conservées uniquement dans ce navigateur. Le bouton Ouvrir change l’espace après acceptation.</small></div>}</div></PreviewNavigation.Provider></PreviewIdentity.Provider>;
}
