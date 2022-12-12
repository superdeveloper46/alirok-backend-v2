import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ForwarderService } from './forwarder.service';
import { CreateData } from './dto/forwarder.dto';
import { Roles } from 'src/common/decorator/roles.decorator';

@Controller('forwarders')
export class ForwarderController {
  constructor(private readonly forwarderService: ForwarderService) {}

  @Roles('user')
  @Post('auth')
  async create(@Body() companyData: CreateData) {
    return this.forwarderService.create(companyData);
  }

  @Post()
  async createWithoutAuth(@Body() companyData: CreateData) {
    return this.forwarderService.create(companyData);
  }

  @Roles('user')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.forwarderService.delete(id);
  }
}
