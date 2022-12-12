import {
  enum_appointment_types,
  enum_days_name_short,
} from '@generated/client';
import { Type } from 'class-transformer';
import {
  IsValidOperationDays,
  IsValidOperationHours,
  OperationalHours,
} from '../../../common/class-validator/operation-day-hours.validator';
import {
  IsUUID,
  IsString,
  ValidateNested,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsOptional,
  IsNumberString,
  MaxLength,
  IsJSON,
} from 'class-validator';
import { InputJsonValue } from 'src/app/misc/address/interfaces/createLocation.interface';

export class Phone {
  @IsNumberString()
  prefix: string;

  @IsString()
  countryCode: string;

  @IsNumberString()
  number: string;
}

export class LocationAddress {
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

  @IsOptional()
  raw_address?: InputJsonValue;
}

export class UpsertDropOffLocationDTO {
  @IsOptional()
  @IsUUID()
  drop_off_location_uuid?: string;

  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsUUID(4, { each: true })
  @ArrayMinSize(1)
  modal_uuids: string[];

  @IsNotEmpty()
  @IsUUID()
  warehouse_type_uuid: string;

  @IsArray()
  @IsUUID(4, { each: true })
  @ArrayMinSize(1)
  carrier_company_uuids: string[];

  @ValidateNested()
  @Type(() => LocationAddress)
  @IsNotEmpty()
  location_address: LocationAddress;

  @IsNotEmpty()
  @IsEnum(enum_appointment_types)
  appointment_type: enum_appointment_types;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, {
    message:
      'Additional instructions must be shorter than or equal to 500 characters',
  })
  additional_instructions: string;

  @ValidateNested()
  @Type(() => Phone)
  @IsNotEmpty()
  phone: Phone;

  @ValidateNested({ each: true })
  @ArrayMinSize(7)
  @ArrayMaxSize(7)
  @IsValidOperationDays({
    message: `Operational days must be ${Object.values(enum_days_name_short)
      .map((row) => row)
      .join(', ')} and unique`,
  })
  @IsValidOperationHours({
    message: `Operational hours or closed flag must be valid for all days`,
  })
  @Type(() => OperationalHours)
  operational_hours: OperationalHours[];
}

export class DeleteDropOffLocationDTO {
  @IsNotEmpty()
  @IsUUID()
  drop_off_location_uuid: string;
}

export class FetchDropOffLocationDTO {
  @IsNotEmpty()
  @IsUUID()
  drop_off_location_uuid: string;
}
