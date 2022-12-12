import { ApiProperty } from '@nestjs/swagger';

export class AirportLocationEntity {
  @ApiProperty({
    example: 'b9f13c95-d38d-5669-a7c6-874be297df03',
    description: 'The Airport Entity',
  })
  airport_uuid: string;

  @ApiProperty({
    example: 'b9f13c95-d38d-5669-a7c6-874be297df03',
    description: 'The Parcel Route Entity',
  })
  parcel_route_uuid: string;

  @ApiProperty({
    example: 'b9f13c95-d38d-5669-a7c6-874be297df03',
    description: 'The Location Reference Type Entity',
  })
  location_reference_type_uuid: string;
}
