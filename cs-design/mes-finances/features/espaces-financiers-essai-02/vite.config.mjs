import { defineConfig } from '../../../../node_modules/vite/dist/node/index.js';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import tailwind from '../../../../node_modules/@tailwindcss/postcss/dist/index.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const mocks = path.join(here, 'mocks');
// All server modules are replaced before resolution. No .env or DB code enters preview.
const simulatedServices = {
 name:'isolated-services', enforce:'pre',
 resolveId(id) {
  if(id.startsWith(root+'/lib/')) id='@/'+id.slice(root.length+1);
  if(id.startsWith('@/lib/actions/')) return '\0simulated:'+id;
  if(id==='@/lib/auth/client') return path.join(mocks,'auth.jsx');
  if(id==='@neondatabase/auth/react') return path.join(mocks,'AuthView.jsx');
  if(id==='next/navigation') return path.join(mocks,'navigation.jsx');
  if(id==='next/link') return path.join(mocks,'Link.jsx');
  if(id==='@/lib/db' || id.startsWith('@neondatabase/serverless') || id==='server-only') throw new Error('Server dependency forbidden in mockups: '+id);
 },
 transform(code,id){if(id===path.join(root,'app/auth/[path]/page.tsx'))return code.replace('export default async function AuthPage','export default function AuthPage').replace('const { path } = await params;','const { path } = params;');},
 load(id) {
  if(!id.startsWith('\0simulated:')) return;
  const source=id.slice('\0simulated:'.length);
  const code=readFileSync(path.join(root,source.replace('@/', '')+'.ts'),'utf8');
  const names=[...code.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)].map(x=>x[1]);
  return `import { simulate } from ${JSON.stringify(path.join(mocks,'services.jsx'))};\n`+names.map(n=>`export async function ${n}(...args){return simulate(${JSON.stringify(n)},args);}`).join('\n');
 }
};
export default defineConfig({root:here,envDir:path.join(here,'.cache/no-env'),cacheDir:path.join(here,'.cache/vite'),optimizeDeps:{entries:[path.join(here,'index.html')]},plugins:[simulatedServices],resolve:{alias:[{find:'@',replacement:root}],dedupe:['react','react-dom']},esbuild:{jsx:'automatic'},css:{postcss:{plugins:[tailwind({base:root})]}},server:{host:'127.0.0.1',port:4301,strictPort:true,fs:{allow:[root]}},build:{outDir:path.join(here,'.cache/dist'),emptyOutDir:true}});
