import { IsUUID, IsNotEmpty, IsString } from 'class-validator';

export class FetchParcelRouteDTO {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  parcel_route_uuid: string;
}
