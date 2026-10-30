import * as path from 'path';
import * as initialSchema from './migrations/001_initial_schema';
import * as addRolesSchema from './migrations/002_add_roles';
import * as addPaymentSchema from './migrations/003_add_payment_details';
import * as deletedAtSchema from './migrations/004_add_deleted_at';
import * as addProRequestedSchema from './migrations/005_add_pro_requested';
import * as addWorkspaceIdToUsers from './migrations/006_add_workspace_id_to_users';

// nosemgrep
import { config } from 'dotenv';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Migrator } from 'kysely/migration';
import { Database } from './database';

const envPath = path.resolve(__dirname, '../../../../.env');
config({ path: envPath });

async function runMigrations() {
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString: process.env.DATABASE_URL }),
    }),
  });

  const migrator = new Migrator({
    db,
    provider: {
      getMigrations() {
        return Promise.resolve({
          '001_initial_schema': initialSchema,
          '002_add_roles': addRolesSchema,
          '003_add_payment_details': addPaymentSchema,
          '004_add_deleted_at': deletedAtSchema,
          '005_add_pro_requested': addProRequestedSchema,
          '006_add_workspace_id_to_users': addWorkspaceIdToUsers,
        });
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

runMigrations().catch(console.error);
