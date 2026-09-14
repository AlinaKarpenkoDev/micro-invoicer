export interface InvoiceDTO {
  id: string;
  client_name: string;
  amount: number;
  status: "PENDING" | "PAID";
}
