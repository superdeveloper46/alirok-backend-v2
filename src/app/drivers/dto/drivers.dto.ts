import { enum_sta_license_status } from '@generated/client';
import { Type } from 'class-transformer';
import {
  IsString,
  ValidateNested,
  IsEnum,
  IsOptional,
  IsNumberString,
  IsNotEmpty,
  IsUUID,
  IsDate,
} from 'class-validator';

export class Phone {
  @IsNumberString()
  prefix: string;

  countryCode?: string;

  @IsNumberString()
  number: string;
}

export class DriversDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsString()
  @IsOptional()
  photo: string;

  @IsString()
  email: string;

  @ValidateNested()
  @Type(() => Phone)
  @IsOptional()
  phone: Phone;

  @IsString()
  license_number: string;

  @IsEnum(['YES', 'NO', 'IN_PROGRESS'])
  sta_license_status: 'YES' | 'NO' | 'IN_PROGRESS';

  @IsString()
  @IsOptional()
  sta_number: string;

  @IsDate()
  @IsOptional()
  sta_expiration_date: Date;

  @IsDate()
  @IsOptional()
  iacssp_training_date: Date;

  @IsDate()
  @IsOptional()
  iacssp_expiration_date: Date;
}

export class DeleteDriverDTO {
  @IsNotEmpty()
  @IsUUID()
  driver_uuid: string;
}

export class GetDriversDto {
  @IsNumberString()
  @IsOptional()
  skip?: number;

  @IsNumberString()
  @IsOptional()
  take?: number;
}

export class GetDriverInfoDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsString()
  license_number: string;
}
