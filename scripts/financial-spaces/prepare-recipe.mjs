/** Recover a clean recipe from the verified baseline, retaining the former work DB. */
import fs from 'node:fs';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {localConnection,directory} from './local-fixture.mjs';
import {legacyFingerprint,runMigrations} from './migrate.mjs';
import {verifyConservation} from './verify-conservation.mjs';
if(process.argv.slice(2).join(' ')!=='--activate')throw Error('Explicit --activate is required for this local-only recovery.');
const archive='spaces_work17_before_invitations';
const staged='spaces_migration_test_'+randomBytes(4).toString('hex');
const output=path.join(directory,'recipe-activation');fs.mkdirSync(output,{recursive:true,mode:0o700});
const admin=await localConnection();let old,baseline,stage;
try{
 if((await admin.query('SELECT 1 FROM pg_database WHERE datname=$1',[archive])).rowCount)throw Error('The preserved work archive already exists; do not replace it.');
 if((await admin.query("SELECT count(*)::integer AS count FROM pg_stat_activity WHERE datname='spaces_work17'")).rows[0].count)throw Error('Stop the local recipe before activation.');
 old=await localConnection('spaces_work17');
 if((await old.query('SELECT phase FROM financial_space_rollout WHERE singleton')).rows[0]?.phase!=='backfilled')throw Error('Unexpected old work phase; no database renamed.');
 const oldFingerprint=await legacyFingerprint(old);await old.end();old=null;
 baseline=await localConnection('spaces_baseline17');const original=await legacyFingerprint(baseline);await baseline.end();baseline=null;
 await admin.query(`CREATE DATABASE "${staged}" TEMPLATE spaces_baseline17`);
 stage=await localConnection(staged);const result=await runMigrations(stage,{through:'006',dryRun:false,allowCutover:true});
 if(JSON.stringify(await legacyFingerprint(stage))!==JSON.stringify(original))throw Error('Restored recipe differs from baseline.');
 await stage.end();stage=null;
 for(const file of ['conservation-report.json','work-runtime-guide-drift.json','work-runtime-integrity-report.json']){
  const source=path.join(directory,file);if(fs.existsSync(source))fs.copyFileSync(source,path.join(output,'previous-'+file),fs.constants.COPYFILE_EXCL);
 }
 // Refuse new connections between final inactivity check and the rename.
 await admin.query('ALTER DATABASE spaces_work17 WITH ALLOW_CONNECTIONS false');
 if((await admin.query("SELECT count(*)::integer AS count FROM pg_stat_activity WHERE datname='spaces_work17'")).rows[0].count){await admin.query('ALTER DATABASE spaces_work17 WITH ALLOW_CONNECTIONS true');throw Error('A local writer connected; activation refused.');}
 await admin.query(`ALTER DATABASE spaces_work17 RENAME TO "${archive}"`);
 await admin.query(`ALTER DATABASE "${archive}" WITH ALLOW_CONNECTIONS true`);
 await admin.query(`ALTER DATABASE "${staged}" RENAME TO spaces_work17`);
 const report={at:new Date().toISOString(),source:'spaces_baseline17',work:'spaces_work17',preservedArchive:archive,oldFingerprint,migration:result};
 fs.writeFileSync(path.join(output,'activation.json'),JSON.stringify(report,null,2)+'\n',{mode:0o600});
 const certificate=await verifyConservation({outputDirectory:output});
 console.log(JSON.stringify({activatedLocalRecipe:true,preservedArchive:archive,conservedOriginalRows:certificate.originalRows,migrations:result.files.length,sourceDatabaseModified:false}));
}finally{await Promise.allSettled([old?.end(),baseline?.end(),stage?.end(),admin.end()].filter(Boolean));}
