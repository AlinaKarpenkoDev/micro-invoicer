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

  private async getWorkspaceOrThrow(userId: string) {
    let workspace = await this.db
      .selectFrom('workspaces')
      .select(['id', 'is_pro'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    if (workspace) return workspace;

    const user = await this.db
      .selectFrom('users')
      .select(['workspace_id'])
      .where('id', '=', userId)
      .executeTakeFirst();

    if (user?.workspace_id) {
      workspace = await this.db
        .selectFrom('workspaces')
        .select(['id', 'is_pro'])
        .where('id', '=', user.workspace_id)
        .executeTakeFirst();
    }
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async createInvoice(
    userId: string,
    clientName: string,
    amount: number,
    paymentDetails?: string,
  ) {
    return await this.db.transaction().execute(async (trx) => {
      const workspace = await this.getWorkspaceOrThrow(userId);

      if (!workspace.is_pro) {
        const { count } = await trx
          .selectFrom('invoices')
          .select((eb) => eb.fn.count('id').as('count'))
          .where('workspace_id', '=', workspace.id)
          .executeTakeFirstOrThrow();

        const currentInvoicesCount = Number(count);

        if (currentInvoicesCount >= 3) {
          throw new ForbiddenException(
            'The limit on free invoices has been reached',
          );
        }
      }
      const newInvoice = await trx
        .insertInto('invoices')
        .values({
          workspace_id: workspace.id,
          client_name: clientName,
          amount: amount,
          status: 'PENDING',
          payment_details: paymentDetails,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return newInvoice;
    });
  }

  async getInvoices(userId: string) {
    const workspace = await this.getWorkspaceOrThrow(userId);

    const totalCountResult = await this.db
      .selectFrom('invoices')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('workspace_id', '=', workspace.id)
      .executeTakeFirstOrThrow();

    const totalInvoicesCount = Number(totalCountResult.count);

    const invoices = await this.db
      .selectFrom('invoices')
      .selectAll()
      .where('workspace_id', '=', workspace.id)
      .where('deleted_at', 'is', null)
      .execute();

    const archivedInvoices = await this.db
      .selectFrom('invoices')
      .selectAll()
      .where('workspace_id', '=', workspace.id)
      .where('deleted_at', 'is not', null)
      .execute();

    const assistants = await this.db
      .selectFrom('users')
      .select(['id', 'email'])
      .where('workspace_id', '=', workspace.id)
      .where('role', '=', 'ASSISTANT')
      .execute();

    return {
      data: invoices,
      isPro: workspace.is_pro,
      totalCount: totalInvoicesCount,
      archived: archivedInvoices,
      assistants: assistants,
    };
  }

  async getInvoiceById(userId: string, invoiceId: string) {
    const workspace = await this.getWorkspaceOrThrow(userId);

    const invoices = await this.db
      .selectFrom('invoices')
      .selectAll()
      .where('id', '=', invoiceId)
      .where('workspace_id', '=', workspace.id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    if (!invoices) {
      throw new NotFoundException('Invoice not found');
    }
    return { ...invoices, is_pro: workspace.is_pro };
  }

  async upgradeWorkspace(adminId: string, targetUserId: string) {
    const workspace = await this.db
      .updateTable('workspaces')
      .set({ is_pro: true, pro_requested: false })
      .where('user_id', '=', targetUserId)
      .returning(['id'])
      .executeTakeFirst();

    if (workspace) {
      await this.db
        .updateTable('invoices')
        .set({ pdf_url: null })
        .where('workspace_id', '=', workspace.id)
        .execute();
    }

    return { success: true, message: 'Updated to Pro!' };
  }

  async savePdfUrl(invoiceId: string, pdfUrl: string) {
    await this.db
      .updateTable('invoices')
      .set({ pdf_url: pdfUrl })
      .where('id', '=', invoiceId)
      .execute();
  }

  async getAllWorkspacesForAdmin() {
    const workspaces = await this.db
      .selectFrom('workspaces')
      .innerJoin('users', 'users.id', 'workspaces.user_id')
      .select([
        'workspaces.id as workspace_id',
        'workspaces.name as workspace_name',
        'workspaces.is_pro',
        'users.email as owner_email',
        'users.id as owner_id',
        'workspaces.pro_requested',
      ])
      .orderBy('workspaces.pro_requested', 'desc')
      .execute();

    return workspaces;
  }

  async deleteInvoice(userId: string, invoiceId: string) {
    const workspace = await this.getWorkspaceOrThrow(userId);

    await this.db
      .updateTable('invoices')
      .set({ deleted_at: new Date(), status: 'DELETED' })
      .where('id', '=', invoiceId)
      .where('workspace_id', '=', workspace.id)
      .execute();

    return {
      success: true,
      message: 'The invoice has been successfully deleted',
    };
  }

  async updateInvoice(
    userId: string,
    invoiceId: string,
    clientName: string,
    amount: number,
    paymentDetails?: string,
  ) {
    const workspace = await this.getWorkspaceOrThrow(userId);

    await this.db
      .updateTable('invoices')
      .set({
        client_name: clientName,
        amount: amount,
        pdf_url: null,
        payment_details: paymentDetails,
      })
      .where('id', '=', invoiceId)
      .where('workspace_id', '=', workspace.id)
      .execute();

    return {
      success: true,
      message: 'The invoice has been successfully updated',
    };
  }

  async requestUpgrade(userId: string) {
    await this.db
      .updateTable('workspaces')
      .set({ pro_requested: true })
      .where('user_id', '=', userId)
      .execute();

    return { success: true, message: 'Pro upgrade requested' };
  }

  async rejectUpgrade(targetUserId: string) {
    const workspace = await this.db
      .updateTable('workspaces')
      .set({ pro_requested: false, is_pro: false })
      .where('user_id', '=', targetUserId)
      .returning(['id'])
      .executeTakeFirst();

    if (workspace) {
      await this.db
        .updateTable('invoices')
        .set({ pdf_url: null })
        .where('workspace_id', '=', workspace.id)
        .execute();
    }
    return { success: true, message: 'Upgrade request rejected' };
  }

  async updateInvoiceStatus(
    userId: string,
    invoiceId: string,
    status: 'PENDING' | 'PAID',
  ) {
    const workspace = await this.getWorkspaceOrThrow(userId);

    await this.db
      .updateTable('invoices')
      .set({ status })
      .where('id', '=', invoiceId)
      .where('workspace_id', '=', workspace.id)
      .where('deleted_at', 'is', null)
      .execute();

    return { success: true, message: 'Update status' };
  }
}
