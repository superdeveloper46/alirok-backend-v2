import { Module } from '@nestjs/common';
import { WeekDaysController } from './week-days.controller';
import { WeekDaysService } from './week-days.service';

@Module({
  controllers: [WeekDaysController],
  providers: [WeekDaysService]
})
export class WeekDaysModule {}
