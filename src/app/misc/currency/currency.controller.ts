import { Controller, Get, Query } from '@nestjs/common';
import { CurrencyService } from './currency.service';
import { ConvertCurrencyRateDTO } from './currency.dto';
import { Roles } from '../../../common/decorator/roles.decorator';

@Controller('misc/currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get()
  findAll() {
    return this.currencyService.findAll();
  }

  @Roles('user')
  @Get('/convert-rate')
  convertCurrencyRate(@Query() rate: ConvertCurrencyRateDTO) {
    return this.currencyService.convertCurrencyRate(
      rate.toCurrencyCode,
      rate.fromCurrencyCode,
    );
  }
}
