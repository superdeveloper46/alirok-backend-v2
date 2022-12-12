import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDTO,
} from '../../../app/couriers/dto/newCouriers.dto';

export class NewGetParcelBookingDataDTO {
  @IsNotEmpty()
  @IsUUID(4)
  uuid?: string;
}

export class NewCreateParcelBookingPhoneDTO {
  @IsOptional()
  @IsString()
  countryCode: string;
  @IsOptional()
  @IsString()
  number: string;
}

export class NewCreateParcelBookingAddressDataDTO {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  memberId?: string;

  @IsNotEmpty()
  @IsIn(['residential', 'commercial'])
  addressType: 'residential' | 'commercial';

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  streetNumber?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  additionalAddress?: string;

  @IsOptional()
  @IsString()
  complementAddress?: string;

  @IsOptional()
  @IsString()
  airportId?: string;

  @IsOptional()
  @IsString()
  airportIataCode?: string;

  @IsOptional()
  @IsString()
  airportName?: string;
}

export class NewCreateParcelBookingActorDTO {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @IsIn(['INDIVIDUAL', 'CORPORATION'])
  type?: 'INDIVIDUAL' | 'CORPORATION';

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewCreateParcelBookingPhoneDTO)
  phone?: NewCreateParcelBookingPhoneDTO;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewCreateParcelBookingAddressDataDTO)
  address?: NewCreateParcelBookingAddressDataDTO;

  @IsOptional()
  @IsBoolean()
  edited?: boolean;

  @IsOptional()
  @IsIn(['ADDRESS', 'USER', 'MEMBER', 'COMPANY', 'AIRPORT'])
  pre_filled?: 'ADDRESS' | 'USER' | 'MEMBER' | 'COMPANY' | 'AIRPORT';
}

export class NewCreateParcelBookingUserDTO {
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsBoolean()
  third_party: boolean;
}

export class NewCreateParcelBookingDTO {
  @IsOptional()
  @IsString()
  uuid?: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => NewCreateParcelBookingUserDTO)
  user: NewCreateParcelBookingUserDTO;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => NewRateShipmentDTO)
  quote: NewRateShipmentDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewCreateParcelBookingActorDTO)
  sender?: NewCreateParcelBookingActorDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewCreateParcelBookingActorDTO)
  recipient?: NewCreateParcelBookingActorDTO;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => NewCreateParcelBookingActorDTO)
  order: NewRateShipmentReturnDTO;

  @IsNotEmpty()
  @IsBoolean()
  draft: boolean;
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
