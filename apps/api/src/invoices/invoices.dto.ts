import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsIn,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  @IsNotEmpty()
  client_name!: string;
  @IsInt()
  @Min(1)
  amount!: number;
  @IsOptional()
  @IsString()
  payment_details!: string;
}
export class UpdateStatusDto {
  @IsIn(['PENDING', 'PAID'])
  status!: 'PENDING' | 'PAID';
}
