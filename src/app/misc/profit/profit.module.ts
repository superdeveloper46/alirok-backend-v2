import { Module } from '@nestjs/common';
import { FormattersModule } from '../formatters/formatters.module';
import { ProfitService } from './profit.service';

@Module({
  providers: [ProfitService],
  imports: [FormattersModule],
  exports: [ProfitService],
})
export class ProfitModule {}
