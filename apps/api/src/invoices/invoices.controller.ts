import {
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
  Get,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './invoices.dto';
import { PdfService } from './pdf.service';

@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly pdfService: PdfService,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async create(@Request() req: any, @Body() body: CreateInvoiceDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = req.user.sub as string;

    return this.invoicesService.createInvoice(
      userId,
      body.client_name,
      body.amount,
    );
  }

  @UseGuards(AuthGuard)
  @Get()
  async getAll(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const userId = req.user.sub as string;
    return this.invoicesService.getInvoices(userId);
  }

  @UseGuards(AuthGuard)
  @Get(':id/pdf')
  async downloadPdf(@Request() req: any, @Param('id') id: string) {
    const userId = req.user.sub as string;
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
  async upgradeToPro(@Request() req: any) {
    const userId = req.user.sub as string;
    return this.invoicesService.upgradeWorkspace(userId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/workspaces')
  async getAdminWorkspaces() {
    return this.invoicesService.getAllWorkspacesForAdmin();
  }
}
