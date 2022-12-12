import { Controller, Get } from '@nestjs/common';
import { CompaniesCarriersService } from './companies-carriers.service';
import { Roles } from '../../../common/decorator/roles.decorator';
import { CurrentCompany } from '../../../common/decorator/current-company.decorator';

@Controller('misc/companies')
export class CompaniesCarriersController {
  constructor(
    private readonly companiesCarriersService: CompaniesCarriersService,
  ) {}

  @Roles('user')
  @Get('/carriers')
  findCarriers(@CurrentCompany() currentCompany: string) {
    return this.companiesCarriersService.findCarriers(currentCompany);
  }
}
