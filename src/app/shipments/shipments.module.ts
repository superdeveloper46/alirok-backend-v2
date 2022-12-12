import { Module } from '@nestjs/common';
import { ShipmentsController } from './shipments.controller';
import { ShipmentsService } from './shipments.service';

@Module({
  providers: [ShipmentsService],
  controllers: [ShipmentsController],
  imports: [],
})
export class ShipmentsModule {}
