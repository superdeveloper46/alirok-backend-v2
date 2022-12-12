import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

class LocationsDto {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postal_code?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsUUID()
  location_reference_type_uuid: string;

  @IsUUID()
  parcel_route_uuid: string;
}

export class CreateParcelRouteLocationReferenceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationsDto)
  locations: LocationsDto[];

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  parcel_route_uuid: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  location_reference_type_uuid: string;
}
