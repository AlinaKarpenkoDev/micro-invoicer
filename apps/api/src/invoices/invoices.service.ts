import {
  Inject,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Kysely } from 'kysely';
import { Database } from '../database/database';

@Injectable()
export class InvoicesService {
  constructor(@Inject('DB_INSTANCE') private readonly db: Kysely<Database>) {}

  async createInvoice(userId: string, clientName: string, amount: number) {
    const workspace = await this.db
      .selectFrom('workspaces')
      .select(['id', 'is_pro'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      throw new NotFoundException('Простір не знайдено');
    }

    if (!workspace.is_pro) {
      const { count } = await this.db
        .selectFrom('invoices')
        .select((eb) => eb.fn.count('id').as('count'))
        .where('workspace_id', '=', workspace.id)
        .executeTakeFirstOrThrow();

      const currentInvoicesCount = Number(count);

      if (currentInvoicesCount >= 3) {
        throw new ForbiddenException('Ліміт безкоштовних інвойсів вичерпано');
      }
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
      .select(['id', 'is_pro'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      return { data: [], isPro: false };
    }

    const invoices = await this.db
      .selectFrom('invoices')
      .selectAll()
      .where('workspace_id', '=', workspace.id)
      .execute();

    return {
      data: invoices,
      isPro: workspace.is_pro,
    };
  }

  async getInvoiceById(userId: string, invoiceId: string) {
    const workspace = await this.db
      .selectFrom('workspaces')
      .select(['id', 'is_pro'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (!workspace) {
      throw new NotFoundException('Простір не знайдено');
    }

    const invoices = await this.db
      .selectFrom('invoices')
      .selectAll()
      .where('id', '=', invoiceId)
      .where('workspace_id', '=', workspace.id)
      .executeTakeFirst();

    if (!invoices) {
      throw new NotFoundException('Інвойс не знайдено');
    }
    return { ...invoices, is_pro: workspace.is_pro };
  }

  async upgradeWorkspace(userId: string) {
    const workspace = await this.db
      .updateTable('workspaces')
      .set({ is_pro: true })
      .where('user_id', '=', userId)
      .execute();

    return { success: true, message: 'Оновлено до Pro!' };
  }

  async savePdfUrl(invoiceId: string, pdfUrl: string) {
    await this.db
      .updateTable('invoices')
      .set({ pdf_url: pdfUrl })
      .where('id', '=', invoiceId)
      .execute();
  }

  async getAllWorkspacesForAdmin() {
    // Дістаємо всі простори разом з імейлами їх власників
    const workspaces = await this.db
      .selectFrom('workspaces')
      .innerJoin('users', 'users.id', 'workspaces.user_id')
      .select([
        'workspaces.id as workspace_id',
        'workspaces.name as workspace_name',
        'workspaces.is_pro',
        'users.email as owner_email',
        'users.id as owner_id',
      ])
      .execute();

    return workspaces;
  }
}
