import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  client_name!: string;
  @IsNumber()
  @Min(1)
  amount!: number;
}
