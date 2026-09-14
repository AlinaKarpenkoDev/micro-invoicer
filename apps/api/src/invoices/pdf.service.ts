import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  generateInvoicePdf(clientName: string, amount: number) {
    const doc = new PDFDocument({ margin: 50 });

    doc.fontSize(24).text('INVOICE', { align: 'center' }).moveDown(2);
    doc.fontSize(16).text(`Client: ${clientName}`).moveDown();

    doc
      .fontSize(16)
      .text(`Total Amount: $${(amount / 100).toFixed(2)}`)
      .moveDown(3);

    doc
      .fontSize(12)
      .font('Helvetica-Oblique')
      .text('Thank you for your business!');

    return doc;
  }
}
