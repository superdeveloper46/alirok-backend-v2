import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CurrencyController } from './currency.controller';
import { CurrencyService } from './currency.service';

@Module({
  controllers: [CurrencyController],
  providers: [CurrencyService],
  imports: [HttpModule],
})
export class CurrencyModule {}
