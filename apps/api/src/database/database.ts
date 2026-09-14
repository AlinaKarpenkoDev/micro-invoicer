import { ColumnType, Generated } from 'kysely';

export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  // ColumnType<Select, Insert, Update>
  // База сама ставить дату (тому Insert = string | undefined), а змінювати її не можна (Update = never)
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface WorkspacesTable {
  id: Generated<string>;
  user_id: string; // Зв'язок з власником (User)
  name: string;
  is_pro: ColumnType<boolean, boolean | undefined, boolean>; // За замовчуванням буде false
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface SessionsTable {
  id: string; // Це буде наш унікальний Session ID, який ми згенеруємо
  user_id: string;
  user_agent: string; // З якого браузера зайшли
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface InvoicesTable {
  id: Generated<string>;
  workspace_id: string; // До якого простору належить інвойс
  client_name: string;
  amount: number;
  status: 'PENDING' | 'PAID';
  pdf_url: string | null; // Спочатку PDF немає, тому null
  created_at: ColumnType<Date, string | undefined, never>;
}

// Головний інтерфейс нашої бази
export interface Database {
  users: UsersTable;
  workspaces: WorkspacesTable;
  sessions: SessionsTable;
  invoices: InvoicesTable;
}
