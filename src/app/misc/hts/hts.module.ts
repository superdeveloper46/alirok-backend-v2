import { Module } from '@nestjs/common';
import { HtsController } from './hts.controller';
import { HtsService } from './hts.service';

@Module({
  controllers: [HtsController],
  providers: [HtsService],
  imports: [],
})
export class HtsModule {}
