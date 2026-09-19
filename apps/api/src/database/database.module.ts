import { Global, Module } from '@nestjs/common';
import { Kysely, PostgresDialect } from 'kysely';
import * as pg from 'pg';
import { Database } from './database';

@Global()
@Module({
  providers: [
    {
      provide: 'DB_INSTANCE',
      useFactory: () => {
        return new Kysely<Database>({
          dialect: new PostgresDialect({
            pool: new pg.Pool({
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
