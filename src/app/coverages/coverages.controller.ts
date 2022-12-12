import { Controller, Get } from '@nestjs/common';
import { CoveragesService } from './coverages.service';
import { Roles } from 'src/common/decorator/roles.decorator';

@Controller('coverages')
export class CoveragesController {
  constructor(private readonly coverageService: CoveragesService) {}

  @Roles('user')
  @Get('/')
  findAll() {
    return this.coverageService.findAll();
  }
}
