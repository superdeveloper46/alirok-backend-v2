import { Controller, Get } from '@nestjs/common';
import { PortsService } from './ports.service';
import { Roles } from '../../common/decorator/roles.decorator';

@Controller('ports')
export class PortsController {
  constructor(private readonly portsService: PortsService) {}

  @Roles('user')
  @Get('/')
  findAll() {
    return this.portsService.findAll();
  }
}
