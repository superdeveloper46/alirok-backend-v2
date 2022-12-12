import { Module } from '@nestjs/common';
import { ValueServicesService } from './value-services.service';
import { ValueServicesController } from './value-services.controller';

@Module({
  controllers: [ValueServicesController],
  providers: [ValueServicesService],
  imports: [],
})
export class ValueServicesModule {}
