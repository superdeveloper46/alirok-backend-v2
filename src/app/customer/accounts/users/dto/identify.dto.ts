import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class Phone {
  @IsNumberString()
  prefix: string;

  countryCode?: string;

  @IsNumberString()
  number: string;
}

export class HomeAddress {
  @IsString()
  country: string;

  @IsString()
  state: string;

  @IsString()
  city: string;

  @IsString()
  postal_code: string;

  @IsString()
  address: string;

  @IsString()
  street: string;

  @IsString()
  street_number: string;

  @IsString()
  @IsOptional()
  complement_address?: string;
}

export class IdentifyDto {
  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsString()
  @IsOptional()
  tax_id?: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  password?: string;

  @ValidateNested()
  @Type(() => Phone)
  @IsOptional()
  phone?: Phone;

  @ValidateNested()
  @Type(() => HomeAddress)
  @IsOptional()
  home_address?: HomeAddress;
}
