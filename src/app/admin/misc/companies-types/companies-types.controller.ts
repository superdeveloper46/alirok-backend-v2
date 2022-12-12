import { Body, Controller, Get } from '@nestjs/common';
import { FindAllDto } from './dto/findAll.dto';
import { CompaniesTypesService } from './companies-types.service';
import { Roles } from '../../../../common/decorator/roles.decorator';

@Controller('admin/misc/companies-types')
export class CompaniesTypesController {
  constructor(private readonly companiestypesService: CompaniesTypesService) {}

  @Roles('admin')
  @Get()
  findAll(
    @Body()
    params: FindAllDto,
  ) {
    return this.companiestypesService.findAll(params);
  }
}
