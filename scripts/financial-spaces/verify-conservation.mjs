/** Compare every historical column on the untouched baseline and migrated copy. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { localConnection, directory } from './local-fixture.mjs';
import { legacyFingerprint, financialTables } from './migrate.mjs';

export async function verifyConservation({ connect = localConnection, outputDirectory = directory } = {}) {
  let baseline, work;
  try {
    baseline = await connect('spaces_baseline17');
    work = await connect('spaces_work17');
    await baseline.query('BEGIN READ ONLY ISOLATION LEVEL REPEATABLE READ');
    await work.query('BEGIN READ ONLY ISOLATION LEVEL REPEATABLE READ');
    const before = await legacyFingerprint(baseline);
    const after = await legacyFingerprint(work);
    if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Historical rows differ from untouched baseline.');
    for (const table of financialTables) {
      const result = await work.query(`SELECT count(*)::integer AS count FROM "${table}" WHERE space_id IS NULL`);
      if (result.rows[0].count) throw new Error('Unattributed financial records remain.');
      if (table !== 'allocation_sections') {
        const attribution = await work.query(`SELECT count(*)::integer AS count FROM "${table}" r
          LEFT JOIN legacy_user_space_map m ON m.user_id=r.user_id WHERE r.space_id IS DISTINCT FROM m.space_id`);
        if (attribution.rows[0].count) throw new Error('Historical attribution differs from its owner mapping.');
      }
    }
    const junction = await work.query(`SELECT count(*)::integer AS count FROM allocation_sections j
      JOIN income_allocations a ON a.id=j.allocation_id JOIN sections s ON s.id=j.section_id
      WHERE j.space_id IS DISTINCT FROM a.space_id OR j.space_id IS DISTINCT FROM s.space_id`);
    if (junction.rows[0].count) throw new Error('Cross-space historical junction.');
    const membership = await work.query(`SELECT count(*)::integer AS count FROM legacy_user_space_map m
      LEFT JOIN space_memberships p ON p.space_id=m.space_id AND p.user_id=m.user_id WHERE p.space_id IS NULL`);
    if (membership.rows[0].count) throw new Error('Missing historical membership.');
    const extraMembers = await work.query(`SELECT count(*)::integer AS count FROM legacy_user_space_map m
      JOIN space_memberships p ON p.space_id=m.space_id WHERE p.user_id<>m.user_id`);
    if (extraMembers.rows[0].count) throw new Error('Unexpected shared access before migration validation.');
    const settings = await work.query(`SELECT count(*)::integer AS count FROM settings s
      JOIN legacy_user_space_map m ON m.user_id=s.user_id
      LEFT JOIN space_settings p ON p.space_id=m.space_id
      WHERE p.space_id IS NULL OR (s.default_currency,s.default_reminder_offsets,s.created_at,s.updated_at)
        IS DISTINCT FROM (p.default_currency,p.default_reminder_offsets,p.created_at,p.updated_at)`);
    if (settings.rows[0].count) throw new Error('Historical space settings differ.');
    const defaults = await work.query(`SELECT count(*)::integer AS count FROM legacy_user_space_map m
      LEFT JOIN settings s ON s.user_id=m.user_id LEFT JOIN space_settings p ON p.space_id=m.space_id
      WHERE s.id IS NULL AND (p.space_id IS NULL OR p.default_currency IS DISTINCT FROM 'CAD'
        OR p.default_reminder_offsets IS DISTINCT FROM ARRAY[1,3,7])`);
    if (defaults.rows[0].count) throw new Error('Missing default settings for a historical owner without settings.');
    const guide = await work.query(`SELECT count(*)::integer AS count FROM setup_guide g
      JOIN legacy_user_space_map m ON m.user_id=g.user_id
      LEFT JOIN space_setup_guide p ON p.space_id=m.space_id
      WHERE p.space_id IS NULL OR (g.completed_at,g.dismissed_at,g.reset_at,g.created_at)
        IS DISTINCT FROM (p.completed_at,p.dismissed_at,p.reset_at,p.created_at)`);
    if (guide.rows[0].count) throw new Error('Historical guide state differs.');
    const absentGuide = await work.query(`SELECT count(*)::integer AS count FROM legacy_user_space_map m
      JOIN space_setup_guide p ON p.space_id=m.space_id
      WHERE NOT EXISTS (SELECT 1 FROM setup_guide g WHERE g.user_id=m.user_id)`);
    if (absentGuide.rows[0].count) throw new Error('Historical absence of guide state was changed.');
    const spaces = (await work.query('SELECT count(*)::integer AS count FROM legacy_user_space_map')).rows[0].count;
    const report = { checkedAt: new Date().toISOString(), preserved: true, originalTables: Object.keys(before).length,
      originalRows: Object.values(before).reduce((total, table) => total + table.count, 0),
      migratedSpaces: spaces, noUnattributedFinance: true, settingsAndGuideMatch: true, before, after };
    fs.writeFileSync(path.join(outputDirectory, 'conservation-report.json'), JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
    await baseline.query('ROLLBACK');
    await work.query('ROLLBACK');
    return report;
  } catch {
    // Never leave a previous successful certificate looking current after failure.
    const report = {
      checkedAt: new Date().toISOString(), preserved: false,
      failure: 'Current work copy did not pass full historical conservation verification.',
    };
    fs.writeFileSync(path.join(outputDirectory, 'conservation-report.json'), JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
    return report;
  } finally { await Promise.all([baseline?.end(), work?.end()]); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const report = await verifyConservation();
  if (report.preserved) console.log(JSON.stringify({ preserved: true, originalTables: report.originalTables,
    originalRows: report.originalRows, migratedSpaces: report.migratedSpaces, settingsAndGuideMatch: true }));
  else {
    console.error('Conservation verification failed; historical contents and identifiers omitted.');
    process.exitCode = 1;
  }
}
