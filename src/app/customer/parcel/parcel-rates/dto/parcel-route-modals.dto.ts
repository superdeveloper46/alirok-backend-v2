import { IsArray, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class ParcelRouteModalDto {
  @IsUUID()
  @IsNotEmpty()
  parcel_route_uuid: string;

  @IsOptional()
  @IsUUID()
  issued_label_source_uuid?: string;

  @IsOptional()
  @IsArray()
  first_mile_uuids?: string[];

  @IsOptional()
  @IsArray()
  drop_off_location_uuids?: string[];

  @IsOptional()
  @IsArray()
  last_mile_uuids?: string[];
}
