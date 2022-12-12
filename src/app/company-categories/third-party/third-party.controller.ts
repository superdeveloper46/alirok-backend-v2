import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ThirdPartyService } from './third-party.service';
import { CreateData } from './dto/third-party.dto';
import { Roles } from 'src/common/decorator/roles.decorator';

@Controller('third-parties')
export class ThirdPartyController {
  constructor(private readonly thirdPartyService: ThirdPartyService) {}

  @Roles('user')
  @Post('auth')
  async create(@Body() companyData: CreateData) {
    return this.thirdPartyService.create(companyData);
  }

  @Post()
  async createWithoutAuth(@Body() companyData: CreateData) {
    return this.thirdPartyService.create(companyData);
  }

  @Roles('user')
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.thirdPartyService.delete(id);
  }
}
