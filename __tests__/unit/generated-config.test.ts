import{afterAll,describe,expect,it}from'vitest';
import fs from'node:fs';import path from'node:path';import{randomUUID}from'node:crypto';
import{restoreGeneratedConfigs}from'../../scripts/financial-spaces/generated-config.mjs';
const directory=path.join(process.cwd(),'.local/financial-spaces/config-guard-'+randomUUID());fs.mkdirSync(directory,{recursive:true});
const tsconfig=JSON.stringify({compilerOptions:{strict:true},include:['**/*.ts']});
const nextEnv='import "./.next/dev/types/routes.d.ts";\n// Human comment retained.\n';
const originals=new Map([['tsconfig.json',Buffer.from(tsconfig)],['next-env.d.ts',Buffer.from(nextEnv)]]);
function generated(){fs.writeFileSync(path.join(directory,'tsconfig.json'),JSON.stringify({compilerOptions:{strict:true},include:['**/*.ts','.next-spaces-dev/types/**/*.ts','.next-spaces-dev/dev/types/**/*.ts']}));fs.writeFileSync(path.join(directory,'next-env.d.ts'),'import "./.next-spaces-dev/dev/types/routes.d.ts";\nimport "./.next-spaces-dev/dev/types/root-params.d.ts";\n// Human comment retained.\n');}
afterAll(()=>fs.rmSync(directory,{recursive:true,force:true}));
describe('strict local recipe compiler preservation',()=>{
 it('restores only generated imports and retains the original bytes',()=>{generated();restoreGeneratedConfigs(directory,originals);for(const[file,original]of originals)expect(fs.readFileSync(path.join(directory,file))).toEqual(original);});
 it('also restores a later generation after the first Ready restoration',()=>{for(let count=0;count<2;count++){generated();restoreGeneratedConfigs(directory,originals);}expect(fs.readFileSync(path.join(directory,'next-env.d.ts'),'utf8')).toBe(nextEnv);});
 it('refuses to overwrite a human compiler change',()=>{generated();const changed=JSON.stringify({compilerOptions:{strict:false},include:['**/*.ts','.next-spaces-dev/types/**/*.ts']});fs.writeFileSync(path.join(directory,'tsconfig.json'),changed);expect(()=>restoreGeneratedConfigs(directory,originals)).toThrow('preserving it');expect(fs.readFileSync(path.join(directory,'tsconfig.json'),'utf8')).toBe(changed);});
 it('refuses to overwrite a human declaration-file change',()=>{generated();const changed=fs.readFileSync(path.join(directory,'next-env.d.ts'),'utf8')+'// New human edit\n';fs.writeFileSync(path.join(directory,'next-env.d.ts'),changed);expect(()=>restoreGeneratedConfigs(directory,originals)).toThrow('preserving it');expect(fs.readFileSync(path.join(directory,'next-env.d.ts'),'utf8')).toBe(changed);});
 it('refuses custom includes even under the recipe build directory',()=>{generated();const target=path.join(directory,'tsconfig.json');const config=JSON.parse(fs.readFileSync(target,'utf8'));config.include.push('.next-spaces-dev/custom-types/**/*.ts');const changed=JSON.stringify(config);fs.writeFileSync(target,changed);expect(()=>restoreGeneratedConfigs(directory,originals)).toThrow('preserving it');expect(fs.readFileSync(target,'utf8')).toBe(changed);});
 it('preserves human formatting-only changes',()=>{for(const[file,original]of originals)fs.writeFileSync(path.join(directory,file),original);const formatted=JSON.stringify(JSON.parse(tsconfig),null,4)+'\n';fs.writeFileSync(path.join(directory,'tsconfig.json'),formatted);restoreGeneratedConfigs(directory,originals);expect(fs.readFileSync(path.join(directory,'tsconfig.json'),'utf8')).toBe(formatted);});

});
