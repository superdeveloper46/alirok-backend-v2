import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class SetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Fa-f0-9]{64}$/, { message: 'Password not valid' })
  password?: string;

  @IsBoolean()
  @IsOptional()
  account_activate?: boolean;
}
