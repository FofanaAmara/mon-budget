import { neon } from '@neondatabase/serverless';
import { createLocalDatabase } from './database/local';
import type { DatabaseSql } from './database/types';

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

const mode = process.env.MES_FINANCES_DB_DRIVER ?? 'neon';
if (mode !== 'neon' && mode !== 'local-fixture') throw new Error('Unknown database driver.');

export const sql: DatabaseSql = mode === 'local-fixture'
  ? createLocalDatabase(process.env.POSTGRES_URL, process.env.MES_FINANCES_LOCAL_SYSTEM_ID ?? '').sql
  : neon(process.env.POSTGRES_URL);
