import { ApiProperty } from '@nestjs/swagger';
import { PortEntity } from './port.entity';

export class PortLocationEntity {
  @ApiProperty({
    type: PortEntity,
  })
  port: PortEntity;
}
