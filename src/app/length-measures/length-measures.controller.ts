import { Controller, Get } from '@nestjs/common';
import { LengthMeasuresService } from './length-measures.service';
import { Roles } from '../../common/decorator/roles.decorator';

@Controller('length-measures')
export class LengthMeasuresController {
  constructor(private readonly lengthMeasuresService: LengthMeasuresService) {}

  @Roles('user')
  @Get('/')
  findAll() {
    return this.lengthMeasuresService.findAll();
  }
}
