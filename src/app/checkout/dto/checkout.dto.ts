import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CheckoutParcelBookingPhoneDTO {
  @IsNotEmpty()
  @IsString()
  prefix: string;

  @IsNotEmpty()
  @IsString()
  number: string;
}

export class CheckoutParcelBookingAddressDTO {
  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  postal_code: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  street_number: string;

  @IsOptional()
  is_residential_address: boolean;

  @IsOptional()
  @IsString()
  complement_address?: string;
}

export class CheckoutParcelBookingSenderAndRecipientDTO {
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  tax_id: string;

  @IsOptional()
  @IsString()
  user_uuid?: string;

  @IsOptional()
  @IsString()
  parcel_member_uuid?: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CheckoutParcelBookingAddressDTO)
  address: CheckoutParcelBookingAddressDTO;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CheckoutParcelBookingPhoneDTO)
  phone: CheckoutParcelBookingPhoneDTO;
}

export class CheckoutParcelBookingDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CheckoutParcelBookingSenderAndRecipientDTO)
  recipient: CheckoutParcelBookingSenderAndRecipientDTO;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CheckoutParcelBookingSenderAndRecipientDTO)
  sender: CheckoutParcelBookingSenderAndRecipientDTO;

  @IsNotEmpty()
  @IsString()
  c3p_payment_method_id: string;

  @IsOptional()
  @IsString()
  payment_method_uuid;

  @IsNotEmpty()
  @IsBoolean()
  agree_to_payment_terms: string;
}
