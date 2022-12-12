import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    example: 'b9f13c95-d38d-5669-a7c6-874be297df03',
    description: 'Airport UUID',
  })
  airport_uuid: string;

  @IsUUID()
  @ApiProperty({
    example: 'b9f13c95-d38d-5669-a7c6-874be297df03',
    description: 'Parcel Route UUID',
  })
  parcel_route_uuid: string;

  @IsUUID()
  @ApiProperty({
    example: 'b9f13c95-d38d-5669-a7c6-874be297df03',
    description: 'Location Reference Type UUID',
  })
  location_reference_type_uuid: string;
}

export class CreateAirportLocationDto {
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
