import { Module } from '@nestjs/common';
import { ModalsController } from './modals.controller';
import { ModalsService } from './modals.service';

@Module({
  controllers: [ModalsController],
  providers: [ModalsService]
})
export class ModalsModule {}
