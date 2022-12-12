import { Module } from '@nestjs/common';
import { TruckingController } from './trucking.controller';
import { TruckingService } from './trucking.service';

@Module({
  providers: [TruckingService],
  controllers: [TruckingController],
  imports: [],
})
export class TruckingModule {}
