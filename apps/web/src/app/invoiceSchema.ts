import { z } from "zod";

export const invoiceSchema = z.object({
  clientName: z.string().min(2, "Введіть ваше імя"),
  amount: z.coerce.number().positive("Сума має бути більшою за нуль"),
  paymentDetails: z.string().optional(),
});

export type InvoiceFormInput = z.input<typeof invoiceSchema>;
export type InvoiceFormOutput = z.output<typeof invoiceSchema>;
