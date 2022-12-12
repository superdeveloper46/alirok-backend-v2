import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateCustomFieldDto {
  @IsUUID()
  parcel_route_uuid: string;

  @IsUUID()
  company_uuid: string;

  @IsString()
  field: string;
}
