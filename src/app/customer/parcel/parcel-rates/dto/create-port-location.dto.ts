import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class LocationsDto {
  @IsUUID()
  port_uuid: string;

  @IsUUID()
  parcel_route_uuid: string;

  @IsUUID()
  location_reference_type_uuid: string;
}

export class CreatePortLocationDto {
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
