import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Kysely } from 'kysely';
import { Database } from '../database/database';

@Injectable()
export class InvoicesService {
  constructor(@Inject('DB_INSTANCE') private readonly db: Kysely<Database>) {}

  async createInvoice(userId: string, clientName: string, amount: number) {
    const workspace = await this.db
      .selectFrom('workspaces')
      .select('id')
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      throw new NotFoundException('Простір не знайдено');
    }
    const newInvoice = await this.db
      .insertInto('invoices')
      .values({
        workspace_id: workspace.id,
        client_name: clientName,
        amount: amount,
        status: 'PENDING',
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return newInvoice;
  }

  async getInvoices(userId: string) {
    const workspace = await this.db
      .selectFrom('workspaces')
      .select('id')
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      return [];
    }

    const invoices = await this.db
      .selectFrom('invoices')
      .selectAll()
      .where('workspace_id', '=', workspace.id)
      .execute();

    return invoices;
  }

  async getInvoiceById(userId: string, invoiceId: string) {
    const workspace = await this.db
      .selectFrom('workspaces')
      .select('id')
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      throw new NotFoundException('Простір не знайдено');
    }

    const invoice = await this.db
      .selectFrom('invoices')
      .selectAll()
      .where('id', '=', invoiceId)
      .where('workspace_id', '=', workspace.id)
      .executeTakeFirst();

    if (!invoice) {
      throw new NotFoundException('Інвойс не знайдено');
    }

    return invoice;
  }
}
