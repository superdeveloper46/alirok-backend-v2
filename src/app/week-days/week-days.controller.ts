import { Controller, Get } from '@nestjs/common';
import { WeekDaysService } from './week-days.service';
import { Roles } from '../../common/decorator/roles.decorator';

@Controller('week-days')
export class WeekDaysController {
  constructor(private readonly weekDaysService: WeekDaysService) {}

  @Roles('user')
  @Get('/')
  findAll() {
    return this.weekDaysService.findAll();
  }
}
