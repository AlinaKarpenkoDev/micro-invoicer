import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  private s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  async generateInvoicePdf(clientName: string, amount: number, isPro: boolean) {
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

    if (!isPro) {
      doc.save();
      doc
        .fontSize(40)
        .fillColor('gray')
        .opacity(0.2)
        .rotate(-30, { origin: [doc.page.width / 2, doc.page.height / 2] })
        .text('Created in MicroInvoicer', 0, doc.page.height / 2, {
          align: 'center',
          width: doc.page.width,
        });
      doc.restore();
    }

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
    const fileName = `invoice-${Date.now()}.pdf`;
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    });
    await this.s3Client.send(command);

    return `${process.env.R2_PUBLIC_URL}/${fileName}`;
  }
}
