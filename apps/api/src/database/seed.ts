import * as path from 'path';
import { config } from 'dotenv';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import * as bcrypt from 'bcryptjs';
import { Database } from './database';

const envPath = path.resolve(__dirname, '../../../../.env');
config({ path: envPath });

async function runSeed() {
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString: process.env.DATABASE_URL }),
    }),
  });

  console.log('🌱 Running seed...');

  try {
    const hashedPassword = await bcrypt.hash('admin@gmail.com', 10);

    await db
      .insertInto('users')
      .values({
        email: 'admin@gmail.com',
        password_hash: hashedPassword,
        role: 'ADMIN',
      })
      .execute();

    console.log('✅ Admin admin@gmail.com created successfully!');
  } catch (error: unknown) {
    const pgError = error as { code?: string };
    if (pgError.code === '23505') {
      console.log(
        '⚠️ Admin already exists in the database, skipping creation.',
      );
    } else {
      console.error('❌ Error seeding database:', error);
    }
  } finally {
    await db.destroy();
  }
}

runSeed().catch(console.error);
