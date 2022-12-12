import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ShippingLineService } from './shipping-line.service';
import { CreateData } from './dto/shipping-line.dto';
import { Roles } from 'src/common/decorator/roles.decorator';

@Controller('shipping-lines')
export class ShippingLineController {
  constructor(private readonly shippingLineService: ShippingLineService) {}

  @Roles('user')
  @Post('auth')
  async create(@Body() companyData: CreateData) {
    return this.shippingLineService.create(companyData);
  }

  @Post()
  async createWithoutAuth(@Body() companyData: CreateData) {
    return this.shippingLineService.create(companyData);
  }

  @Roles('user')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.shippingLineService.delete(id);
  }
}
