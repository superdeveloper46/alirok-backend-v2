import { ApiProperty } from '@nestjs/swagger';

export class Health {
  @ApiProperty({ example: 'ok', description: 'The status of the API' })
  status: 'ok';
}
