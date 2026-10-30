import { MinLength, IsString, IsEmail } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;
  @IsString()
  @MinLength(6)
  password!: string;
}
export class LoginDto {
  @IsEmail()
  email!: string;
  @IsString()
  @MinLength(6)
  password!: string;
}
