import { ColumnType, Generated } from 'kysely';

export interface UsersTable {
  id: Generated<string>;
  email: string;
  password_hash: string;
  role: 'OWNER' | 'ASSISTANT' | 'ADMIN';
  created_at: ColumnType<Date, string | undefined, never>;
  workspace_id: ColumnType<
    string | null,
    string | null | undefined,
    string | null
  >;
}

export interface WorkspacesTable {
  id: Generated<string>;
  user_id: string;
  name: string;
  is_pro: ColumnType<boolean, boolean | undefined, boolean>;
  created_at: ColumnType<Date, string | undefined, never>;
  pro_requested: ColumnType<boolean, boolean | undefined, boolean>;
}

export interface SessionsTable {
  id: string;
  user_id: string;
  user_agent: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface InvoicesTable {
  id: Generated<string>;
  workspace_id: string;
  client_name: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'DELETED';
  pdf_url: string | null;
  created_at: ColumnType<Date, string | undefined, never>;
  payment_details: string | null;
  deleted_at: ColumnType<Date, string | undefined, string | Date> | null;
}

export interface Database {
  users: UsersTable;
  workspaces: WorkspacesTable;
  sessions: SessionsTable;
  invoices: InvoicesTable;
}
