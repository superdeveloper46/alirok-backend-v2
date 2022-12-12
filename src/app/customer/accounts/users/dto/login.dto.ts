import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Fa-f0-9]{64}$/, { message: 'Password not valid' })
  password?: string;
}
