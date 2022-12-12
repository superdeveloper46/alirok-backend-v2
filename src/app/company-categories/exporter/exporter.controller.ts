import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ExporterService } from './exporter.service';
import { CreateData } from './dto/exporter.dto';
import { Roles } from 'src/common/decorator/roles.decorator';

@Controller('exporters')
export class ExporterController {
  constructor(private readonly exporterService: ExporterService) {}

  @Roles('user')
  @Post('auth')
  async create(@Body() companyData: CreateData) {
    return this.exporterService.create(companyData);
  }

  @Post()
  async createWithoutAuth(@Body() companyData: CreateData) {
    return this.exporterService.create(companyData);
  }

  @Roles('user')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.exporterService.delete(id);
  }
}
