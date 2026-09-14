import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // 1. Створюємо таблицю Користувачів
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('email', 'varchar', (col) => col.notNull().unique())
    .addColumn('password_hash', 'varchar', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  // 2. Створюємо таблицю Просторів (Workspaces)
  await db.schema
    .createTable('workspaces')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').onDelete('cascade').notNull(),
    )
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('is_pro', 'boolean', (col) => col.defaultTo(false).notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  // 3. Створюємо таблицю Сесій
  await db.schema
    .createTable('sessions')
    .addColumn('id', 'varchar', (col) => col.primaryKey()) // ID сесії генеруємо ми самі
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').onDelete('cascade').notNull(),
    )
    .addColumn('user_agent', 'varchar', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  // 4. Створюємо таблицю Інвойсів
  await db.schema
    .createTable('invoices')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('workspace_id', 'uuid', (col) =>
      col.references('workspaces.id').onDelete('cascade').notNull(),
    )
    .addColumn('client_name', 'varchar', (col) => col.notNull())
    .addColumn('amount', 'integer', (col) => col.notNull()) // Сума в копійках/центах
    .addColumn('status', 'varchar', (col) => col.defaultTo('PENDING').notNull())
    .addColumn('pdf_url', 'varchar') // Може бути порожнім (null)
    .addColumn('created_at', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Видаляємо у зворотному порядку, щоб не зламати зв'язки
  await db.schema.dropTable('invoices').execute();
  await db.schema.dropTable('sessions').execute();
  await db.schema.dropTable('workspaces').execute();
  await db.schema.dropTable('users').execute();
}
