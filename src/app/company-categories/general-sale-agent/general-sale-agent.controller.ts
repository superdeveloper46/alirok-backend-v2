import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { Roles } from 'src/common/decorator/roles.decorator';
import { CreateData } from './dto/general-sale-agent.dto';
import { GeneralSaleAgentService } from './general-sale-agent.service';

@Controller('general-sale-agents')
export class GeneralSaleAgentController {
  constructor(
    private readonly generalSaleAgentService: GeneralSaleAgentService,
  ) {}

  @Roles('user')
  @Post('auth')
  async create(@Body() companyData: CreateData) {
    return this.generalSaleAgentService.create(companyData);
  }

  @Post()
  async createWithoutAuth(@Body() companyData: CreateData) {
    return this.generalSaleAgentService.create(companyData);
  }

  @Roles('user')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.generalSaleAgentService.delete(id);
  }
}
