import { Module } from '@nestjs/common';
import { ForwarderController } from './forwarder.controller';
import { ForwarderService } from './forwarder.service';

@Module({
  providers: [ForwarderService],
  controllers: [ForwarderController],
  imports: [],
})
export class ForwarderModule {}
