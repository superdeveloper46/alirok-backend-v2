import { Controller, Get } from '@nestjs/common';
import { Roles } from 'src/common/decorator/roles.decorator';
import { WarehouseTypesService } from './warehouse-types.service';

@Controller('warehouse-types')
export class WarehouseTypesController {
  constructor(private readonly warehouseTypesService: WarehouseTypesService) {}

  @Roles('user')
  @Get('/')
  listAllWarehouse() {
    return this.warehouseTypesService.listAllWarehouse();
  }
}
