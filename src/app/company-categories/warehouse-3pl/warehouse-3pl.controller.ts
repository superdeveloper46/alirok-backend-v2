import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { Warehouse3plService } from './warehouse-3pl.service';
import { CreateData } from './dto/warehouse-3pl.dto';
import { Roles } from 'src/common/decorator/roles.decorator';

@Controller('warehouse-3pls')
export class Warehouse3plController {
  constructor(private readonly warehouse3plService: Warehouse3plService) {}

  @Roles('user')
  @Post('auth')
  async create(@Body() companyData: CreateData) {
    return this.warehouse3plService.create(companyData);
  }

  @Post()
  async createWithoutAuth(@Body() companyData: CreateData) {
    return this.warehouse3plService.create(companyData);
  }

  @Roles('user')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.warehouse3plService.delete(id);
  }
}
