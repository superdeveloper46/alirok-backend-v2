import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { Roles } from 'src/common/decorator/roles.decorator';
import { AirlineService } from './airline.service';
import { CreateData } from './dto/airline.dto';

@Controller('airlines')
export class AirlineController {
  constructor(private readonly airlineService: AirlineService) {}

  @Roles('user')
  @Post('auth')
  async create(@Body() companyData: CreateData) {
    return this.airlineService.create(companyData);
  }

  @Post()
  async createWithoutAuth(@Body() companyData: CreateData) {
    return this.airlineService.create(companyData);
  }

  @Roles('user')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.airlineService.delete(id);
  }
}
