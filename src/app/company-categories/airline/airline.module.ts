import { Module } from '@nestjs/common';
import { AirlineController } from './airline.controller';
import { AirlineService } from './airline.service';

@Module({
  providers: [AirlineService],
  controllers: [AirlineController],
  imports: [],
})
export class AirlineModule {}
