import { Module } from '@nestjs/common';
import { Warehouse3plController } from './warehouse-3pl.controller';
import { Warehouse3plService } from './warehouse-3pl.service';

@Module({
  providers: [Warehouse3plService],
  controllers: [Warehouse3plController],
  imports: [],
})
export class Warehouse3plModule {}
