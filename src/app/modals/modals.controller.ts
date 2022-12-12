import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../common/decorator/roles.decorator';
import { ModalsService } from './modals.service';

@Controller('modals')
export class ModalsController {
  constructor(private readonly modalsService: ModalsService) {}

  @Roles('user')
  @Get('/')
  findAll() {
    return this.modalsService.findAll();
  }
}
