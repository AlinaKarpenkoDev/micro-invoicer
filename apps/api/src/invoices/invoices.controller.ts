import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Param,
  UseInterceptors,
  Delete,
  Patch,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { InvoicesService } from './invoices.service';
import { ImpersonationInterceptor } from './impersonation.interceptor';
import { CreateInvoiceDto } from './invoices.dto';
import { PdfService } from './pdf.service';
import { AuthUser } from '../auth/user.decorator';
import type { AuthUserPayload } from '../auth/user.decorator';

@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly pdfService: PdfService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @AuthUser() user: AuthUserPayload,
    @Body() body: CreateInvoiceDto,
  ) {
    const userId = user.sub;

    return this.invoicesService.createInvoice(
      userId,
      body.client_name,
      body.amount,
    );
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(ImpersonationInterceptor)
  @Get()
  async getAll(@AuthUser() user: AuthUserPayload) {
    const userId = user.sub;
    return this.invoicesService.getInvoices(userId);
  }

  @UseGuards(AuthGuard)
  @Get(':id/pdf')
  async downloadPdf(
    @AuthUser() user: AuthUserPayload,
    @Param('id') id: string,
  ) {
    if (user.is_impersonating) {
      throw new ForbiddenException(
        'This action is not permitted in admin mode.',
      );
    }

    const userId = user.sub;
    const invoice = await this.invoicesService.getInvoiceById(userId, id);

    if (invoice.pdf_url) {
      return { url: invoice.pdf_url };
    }

    const pdfUrl = await this.pdfService.generateInvoicePdf(
      invoice.client_name,
      Number(invoice.amount),
      invoice.is_pro,
    );

    await this.invoicesService.savePdfUrl(id, pdfUrl);

    return { url: pdfUrl };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('OWNER')
  @Post('upgrade')
  async upgradeToPro(@AuthUser() user: AuthUserPayload) {
    const userId = user.sub;
    return this.invoicesService.upgradeWorkspace(userId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/workspaces')
  async getAdminWorkspaces() {
    return this.invoicesService.getAllWorkspacesForAdmin();
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(@AuthUser() user: AuthUserPayload, @Param('id') id: string) {
    if (user.is_impersonating) {
      throw new ForbiddenException(
        'This action is not permitted in admin mode.',
      );
    }

    const userId = user.sub;

    return this.invoicesService.deleteInvoice(userId, id);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async getOne(@AuthUser() user: AuthUserPayload, @Param('id') id: string) {
    if (user.is_impersonating) {
      throw new ForbiddenException(
        'This action is not permitted in admin mode.',
      );
    }
    const userId = user.sub;

    return this.invoicesService.getInvoiceById(userId, id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @AuthUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() body: CreateInvoiceDto,
  ) {
    if (user.is_impersonating) {
      throw new ForbiddenException(
        'This action is not permitted in admin mode.',
      );
    }

    const userId = user.sub;

    return this.invoicesService.updateInvoice(
      userId,
      id,
      body.client_name,
      body.amount,
    );
  }
}
