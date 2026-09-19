import * as path from 'path';
import * as initialSchema from './migrations/001_initial_schema';
import * as addRolesSchema from './migrations/002_add_roles';

import { config } from 'dotenv';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Migrator } from 'kysely/migration';

const envPath = path.resolve(__dirname, '../../../../.env');
config({ path: envPath });

async function runMigrations() {
  const db = new Kysely<any>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString: process.env.DATABASE_URL }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: {
      async getMigrations() {
        return {
          '001_initial_schema': initialSchema,
          '002_add_roles': addRolesSchema,
        };
      },
    },
  });

  const { error, results } = await migrator.migrateToLatest();

  if (results) {
    for (const it of results) {
      if (it.status === 'Success') {
        console.log(`✅ Migration ${it.migrationName} успішна!`);
      } else {
        console.error(`❌ Migration error ${it.migrationName}`);
      }
    }
  }

  if (error) {
    console.error('Critical error:', error);
    process.exit(1);
  }

  await db.destroy();
}

runMigrations();
