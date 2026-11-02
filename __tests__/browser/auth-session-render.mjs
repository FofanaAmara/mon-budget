import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {localHttpsCertificate} from '../../scripts/financial-spaces/local-https.mjs';

const root=process.cwd();
const evidence=path.join(root,'.local/safari-auth');
fs.mkdirSync(evidence,{recursive:true});
const fixture=fs.mkdtempSync(path.join(evidence,'rsc-fixture-'));
// A shared private evidence directory can live outside a durable worktree.
// Resolve React and Next from this checkout, never from a second parent install.
fs.symlinkSync(path.join(root,'node_modules'),path.join(fixture,'node_modules'),'dir');
const certificate=localHttpsCertificate(root);
const requests=new Map();
let fail=true;
const upstream=https.createServer({key:fs.readFileSync(certificate.key),cert:fs.readFileSync(certificate.cert)},(req,res)=>{
 const user=(req.headers.cookie||'').match(/session_token=(fixture-[A-Z]+)/)?.[1]||'fixture-anonymous';
 requests.set(user,(requests.get(user)||0)+1);
 res.setHeader('Content-Type','application/json');
 if(user==='fixture-E'&&fail){res.statusCode=503;res.end(JSON.stringify({message:'private-provider-payload-must-not-appear'}));return;}
 const now=new Date().toISOString();
 res.end(JSON.stringify({user:{id:user,name:'Synthetic',email:'fixture@example.test',emailVerified:true,createdAt:now,updatedAt:now},session:{id:'synthetic-session',userId:user,token:'synthetic-token',createdAt:now,updatedAt:now,expiresAt:new Date(Date.now()+3600000).toISOString()}}));
});
await new Promise(r=>upstream.listen(0,'127.0.0.1',r));
const reservation=http.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
fs.mkdirSync(path.join(fixture,'app'),{recursive:true});fs.mkdirSync(path.join(fixture,'lib'));
fs.copyFileSync(path.join(root,'lib/auth/server.ts'),path.join(fixture,'lib/server.ts'));
fs.writeFileSync(path.join(fixture,'package.json'),JSON.stringify({name:'auth-session-render-fixture',private:true}));
fs.writeFileSync(path.join(fixture,'next.config.mjs'),`export default {devIndicators:false,agentRules:false};`);
fs.copyFileSync(path.join(root,'app/globals.css'),path.join(fixture,'app/globals.css'));
fs.copyFileSync(path.join(root,'app/spaces.css'),path.join(fixture,'app/spaces.css'));
fs.copyFileSync(path.join(root,'postcss.config.mjs'),path.join(fixture,'postcss.config.mjs'));
fs.copyFileSync(path.join(root,'app/espaces/error.tsx'),path.join(fixture,'app/error.tsx'));
fs.writeFileSync(path.join(fixture,'app/layout.jsx'),`import './globals.css';import './spaces.css';export default function Layout({children}) {return <html lang="fr"><body>{children}</body></html>}`);
fs.writeFileSync(path.join(fixture,'app/page.jsx'),`import {authSessionReader} from '../lib/server';
export const dynamic='force-dynamic';
export default async function Page(){const reads=await Promise.allSettled(Array.from({length:10},()=>authSessionReader.getSession()));return <pre>{JSON.stringify(reads.map(x=>x.status==='fulfilled'?x.value.data?.user?.id:'UNAVAILABLE'))}</pre>}`);
fs.mkdirSync(path.join(fixture,'app/failure'));
fs.writeFileSync(path.join(fixture,'app/failure/page.jsx'),`import {authSessionReader} from '../../lib/server';export const dynamic='force-dynamic';export default async function Page(){await authSessionReader.getSession();return <h1>Chargement repris</h1>}`);
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('NEON_')&&!key.startsWith('POSTGRES')&&!key.startsWith('RESEND')&&!key.startsWith('SMTP')&&!key.startsWith('EMAIL')&&!key.startsWith('DATABASE')));
Object.assign(env,{NEXT_TELEMETRY_DISABLED:'1',NEON_AUTH_BASE_URL:`https://127.0.0.1:${upstream.address().port}/auth/`,NEON_AUTH_COOKIE_SECRET:'fixture-cookie-contract-secret-0123456789abcdef',NODE_EXTRA_CA_CERTS:certificate.cert});
const buildLog=fs.openSync(path.join(fixture,'build.log'),'w');
const build=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'build','--webpack'],{cwd:fixture,env,stdio:['ignore',buildLog,buildLog]});
const [buildCode]=await once(build,'exit');fs.closeSync(buildLog);
if(buildCode!==0){upstream.close();throw Error(`Fixture build failed; see ${fixture}/build.log`);}
const child=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port',String(port)],{cwd:fixture,env,stdio:['ignore','pipe','pipe']});
const log=fs.createWriteStream(path.join(fixture,'next.log'));let output='';child.stdout.on('data',x=>{output+=x;log.write(x)});child.stderr.pipe(log,{end:false});
const report={scope:'Actual Next RSC rendering with synthetic HTTPS Auth; no hosted Auth or DB access',fixture,passed:false};
async function request(user){const res=await fetch(`http://127.0.0.1:${port}/`,{headers:{Cookie:`__Secure-neon-auth.session_token=${user}`},signal:AbortSignal.timeout(60000)});assert.equal(res.status,200);return res.text();}
try{
 const start=Date.now();while(!output.includes('Ready in')){if(child.exitCode!==null)throw Error('Fixture exited');if(Date.now()-start>60000)throw Error('Fixture startup timeout');await new Promise(r=>setTimeout(r,100));}
 const first=await request('fixture-A');assert.ok(first.includes('fixture-A'));assert.equal(requests.get('fixture-A'),1,'One upstream read per RSC request');
 const second=await request('fixture-B');assert.ok(second.includes('fixture-B'));assert.ok(!second.includes('fixture-A'));assert.equal(requests.get('fixture-B'),1);
 await request('fixture-A');assert.equal(requests.get('fixture-A'),2,'A new request must reverify the same user');
 const unavailable=await request('fixture-E');assert.ok(unavailable.includes('UNAVAILABLE'));assert.ok(!unavailable.includes('private-provider-payload'));assert.equal(requests.get('fixture-E'),1);
 fail=false;const recovered=await request('fixture-E');assert.ok(recovered.includes('fixture-E'));assert.equal(requests.get('fixture-E'),2,'Failure must not persist into another request');
 fail=true;
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({extraHTTPHeaders:{Cookie:'__Secure-neon-auth.session_token=fixture-E'}});
  const page=await context.newPage();await page.goto(`http://127.0.0.1:${port}/failure`);
  await page.getByRole('heading',{name:'Ton espace n’a pas pu être chargé.'}).waitFor();
  await page.screenshot({path:path.join(evidence,'session-unavailable-desktop.png'),fullPage:true});
  await page.setViewportSize({width:375,height:812});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:path.join(evidence,'session-unavailable-mobile.png'),fullPage:true});
  fail=false;await page.getByRole('button',{name:'Réessayer',exact:true}).click();
  await page.getByRole('heading',{name:'Chargement repris'}).waitFor({timeout:15000});
  report.errorBoundaryRecovered=true;
 }finally{await browser.close();}
 report.passed=true;report.upstreamReads=Object.fromEntries(requests);console.log(JSON.stringify(report));
}finally{
 child.kill('SIGTERM');await Promise.race([once(child,'exit'),new Promise(r=>setTimeout(r,5000))]);if(child.exitCode===null)child.kill('SIGKILL');
 await new Promise(r=>log.end(r));await new Promise(r=>upstream.close(r));fs.writeFileSync(path.join(evidence,'rsc-deduplication.json'),JSON.stringify(report,null,2)+'\n');
 fs.copyFileSync(path.join(fixture,'next.log'),path.join(evidence,'rsc-final-next.log'));
 if(report.passed)fs.rmSync(fixture,{recursive:true});
}
