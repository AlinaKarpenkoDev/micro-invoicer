import { Global, Module } from '@nestjs/common';
import { Kysely, PostgresDialect } from 'kysely';
import * as pg from 'pg';
import { Database } from './database';

// @Global() означає, що підключення до бази буде доступне всюди в проєкті
@Global()
@Module({
  providers: [
    {
      provide: 'DB_INSTANCE', // За цим ключем ми будемо викликати базу
      useFactory: () => {
        return new Kysely<Database>({
          dialect: new PostgresDialect({
            pool: new pg.Pool({
              // Беремо посилання на базу з нашого .env файлу
              connectionString: process.env.DATABASE_URL,
            }),
          }),
        });
      },
    },
  ],
  exports: ['DB_INSTANCE'],
})
export class DatabaseModule {}
