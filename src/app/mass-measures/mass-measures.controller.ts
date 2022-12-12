import { Controller, Get } from '@nestjs/common';
import { MassMeasuresService } from './mass-measures.service';
import { Roles } from 'src/common/decorator/roles.decorator';

@Controller('mass-measures')
export class MassMeasuresController {
  constructor(private readonly massMeasuresService: MassMeasuresService) {}

  @Roles('user')
  @Get('/')
  findAll() {
    return this.massMeasuresService.findAll();
  }
}
