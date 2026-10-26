export interface InvoiceDTO {
  id: string;
  client_name: string;
  amount: number;
  status: "PENDING" | "PAID" | "DELETED";
  created_at: string;
}
