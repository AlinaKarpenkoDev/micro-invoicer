import { config } from 'dotenv';
import * as path from 'path';

// Підключаємо файл .env
const envPath = path.resolve(__dirname, '../../../../.env');
config({ path: envPath });

import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Migrator } from 'kysely/migration';

// 🎯 ІМПОРТУЄМО НАШУ МІГРАЦІЮ НАПРЯМУ (Це вирішує баг з диском C:\ на Windows!)
import * as initialSchema from './migrations/001_initial_schema';

async function runMigrations() {
  const db = new Kysely<any>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString: process.env.DATABASE_URL }),
    }),
  });

  // Передаємо міграцію як об'єкт, без пошуку по папках
  const migrator = new Migrator({
    db,
    provider: {
      // eslint-disable-next-line @typescript-eslint/require-await
      async getMigrations() {
        return {
          '001_initial_schema': initialSchema,
        };
      },
    },
  });

  console.log('⏳ Запуск міграцій...');
  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success')
      console.log(`✅ Міграція ${it.migrationName} успішна!`);
    else console.error(`❌ Помилка міграції ${it.migrationName}`);
  });

  if (error) {
    console.error('Критична помилка:', error);
    process.exit(1);
  }

  await db.destroy();
}

runMigrations();
