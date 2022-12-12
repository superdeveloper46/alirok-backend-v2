import { Controller, Get, Param, Query } from '@nestjs/common';
import { FindAllDto } from './dto/findAll.dto';
import { CompaniesService } from './companies.service';
import { Roles } from '../../../../common/decorator/roles.decorator';

@Controller('admin/accounts/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Roles('admin')
  @Get('category/:id')
  findAll(
    @Param('id') id: string,
    @Query()
    query: FindAllDto,
  ) {
    return this.companiesService.findByCategory(id, query);
  }

  @Roles('admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }
}
