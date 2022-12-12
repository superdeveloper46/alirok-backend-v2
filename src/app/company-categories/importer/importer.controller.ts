import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ImporterService } from './importer.service';
import { CreateData } from './dto/importer.dto';
import { Roles } from 'src/common/decorator/roles.decorator';

@Controller('importers')
export class ImporterController {
  constructor(private readonly importerService: ImporterService) {}

  @Roles('user')
  @Post('auth')
  async create(@Body() companyData: CreateData) {
    return this.importerService.create(companyData);
  }

  @Post()
  async createWithoutAuth(@Body() companyData: CreateData) {
    return this.importerService.create(companyData);
  }

  @Roles('user')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.importerService.delete(id);
  }
}
