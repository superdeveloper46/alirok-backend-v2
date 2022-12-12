import { ApiProperty } from '@nestjs/swagger';

export class PortEntity {
  @ApiProperty({
    example: 'b9f13c95-d38d-5669-a7c6-874be297df03',
    description: 'The Port Entity',
  })
  port_uuid: string;
}
