import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ToBoolean } from '../../../../../common/pipe/toBoolean.pipe';

export class Phone {
  @IsOptional()
  @IsNumberString()
  prefix?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsNumberString()
  number: string;
}

export class HeadquarterAddress {
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

export class CreateCompanyDto {
  @IsNotEmpty()
  @IsString()
  legal_name: string;

  @IsString()
  @IsOptional()
  fantasy_name?: string;

  @IsString()
  @IsOptional()
  tax_id?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @ValidateNested()
  @Type(() => Phone)
  @IsOptional()
  phone?: Phone;

  @ValidateNested()
  @Type(() => HeadquarterAddress)
  @IsOptional()
  headquarter_address?: HeadquarterAddress;

  @IsUUID()
  @IsOptional()
  company_uuid?: string;

  @IsUUID()
  @IsOptional()
  company_type_uuid?: string;

  @ToBoolean()
  create_empty_company?: boolean;
}
