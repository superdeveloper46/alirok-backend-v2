import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { RateShipmentDTO } from '../../couriers/dto/couriers.dto';

export class CreateParcelBookingMetadataDTO {
  @IsNotEmpty()
  @IsString()
  service_code: string;

  @IsOptional()
  pickup: any;
}

export class CreateParcelBookingPhoneDTO {
  @IsNotEmpty()
  @IsString()
  prefix: string;

  @IsNotEmpty()
  @IsString()
  number: string;
}

export class CreateParcelBookingAddressDTO {
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

export class CreateParcelBookingSenderAndRecipientDTO {
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
  @Type(() => CreateParcelBookingAddressDTO)
  address: CreateParcelBookingAddressDTO;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateParcelBookingPhoneDTO)
  phone: CreateParcelBookingPhoneDTO;
}

export class CreateParcelBookingThirdPartyDTO {
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateParcelBookingPhoneDTO)
  phone: CreateParcelBookingPhoneDTO;
}

export class CreateParcelBookingDTO {
  @IsNotEmpty()
  @IsString()
  user_uuid: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RateShipmentDTO)
  quote: RateShipmentDTO;

  @IsNotEmpty()
  @IsString()
  parcel_rate_source: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateParcelBookingSenderAndRecipientDTO)
  recipient: CreateParcelBookingSenderAndRecipientDTO;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateParcelBookingSenderAndRecipientDTO)
  sender: CreateParcelBookingSenderAndRecipientDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateParcelBookingThirdPartyDTO)
  third_party: CreateParcelBookingThirdPartyDTO;

  @IsOptional()
  @IsString()
  estimated_date: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateParcelBookingMetadataDTO)
  metadata: CreateParcelBookingMetadataDTO;
}

export class CreateParcelBookingReturnBillingCurrencyDTO {
  code: string;

  symbol: string;
}

export class CreateParcelBookingReturnBillingDTO {
  parcel: number;

  sub_total: number;

  payment_method_fee: number;

  total: number;

  currency: CreateParcelBookingReturnBillingCurrencyDTO;
}

export class CreateParcelBookingReturnDTO {
  parcel_booking_uuid: string;

  billing: CreateParcelBookingReturnBillingDTO;
}
