import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PdfService } from './pdf.service';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('../auth/auth.guard', () => ({
  AuthGuard: class {},
}));

jest.mock('kysely', () => ({
  Kysely: class {},
}));

describe('InvoicesController PDF', () => {
  let controller: InvoicesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [
        {
          provide: InvoicesService,
          useValue: {
            getInvoiceById: jest.fn(() =>
              Promise.resolve({ pdf_url: 'http://test.pdf' }),
            ),
          },
        },
        {
          provide: PdfService,
          useValue: { generateInvoicePdf: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<InvoicesController>(InvoicesController);
  });

  it('should return PDF url', async () => {
    const mockUser = {
      sub: '123',
      email: 'test',
      role: 'OWNER',
      is_impersonating: false,
    };
    const result = await controller.downloadPdf(mockUser, 'invoice-1');
    expect(result).toEqual({ url: 'http://test.pdf' });
  });
});
