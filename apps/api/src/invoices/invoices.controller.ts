import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Param,
  UseInterceptors,
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
}
