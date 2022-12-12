import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { TruckingService } from './trucking.service';
import { CreateData } from './dto/trucking.dto';
import { Roles } from 'src/common/decorator/roles.decorator';

@Controller('truckings')
export class TruckingController {
  constructor(private readonly truckingService: TruckingService) {}

  @Roles('user')
  @Post('auth')
  async create(@Body() companyData: CreateData) {
    return this.truckingService.create(companyData);
  }

  @Post()
  async createWithoutAuth(@Body() companyData: CreateData) {
    return this.truckingService.create(companyData);
  }

  @Roles('user')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.truckingService.delete(id);
  }
}
