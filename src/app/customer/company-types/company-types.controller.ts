import { Controller, Get, Post, Body, Query, Delete } from '@nestjs/common';
import { Roles } from 'src/common/decorator/roles.decorator';
import { CompanyTypesService } from './company-types.service';
import { CompanyTypeDto } from './dto/company-type.dto';
@Controller('company-types')
export class CompanyTypesController {
  constructor(private readonly companyTypesService: CompanyTypesService) {}

  @Get()
  findAll() {
    return this.companyTypesService.findAll();
  }

  @Roles('user')
  @Post()
  createCompanyType(
    @Body()
    companyType: CompanyTypeDto,
  ) {
    return this.companyTypesService.createCompanyType(companyType);
  }

  @Roles('user')
  @Post('update')
  updateCompanyType(
    @Query() id: string,
    @Body()
    companyType: CompanyTypeDto,
  ) {
    return this.companyTypesService.updateCompanyType(id, companyType);
  }

  @Roles('user')
  @Delete()
  deleteCompanyType(
    @Query()
    uuid: string,
  ) {
    return this.companyTypesService.deleteCompanyType(uuid);
  }
}
