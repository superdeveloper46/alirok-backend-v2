import { Module } from '@nestjs/common';
import { WarehouseTypesController } from './warehouse-types.controller';
import { WarehouseTypesService } from './warehouse-types.service';

@Module({
  controllers: [WarehouseTypesController],
  providers: [WarehouseTypesService]
})
export class WarehouseTypesModule {}
