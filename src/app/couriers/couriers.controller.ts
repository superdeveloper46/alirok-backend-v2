import { Body, Controller, Post, Query } from '@nestjs/common';
import { CouriersService } from './couriers.service';
import {
  NewRateShipmentCouriersQueryParamsDTO,
  NewRateShipmentDTO,
} from './dto/newCouriers.dto';

@Controller('couriers')
export class CouriersController {
  constructor(private readonly courierService: CouriersService) {}

  @Post('quote')
  async rateCouriers(@Body() rateData: NewRateShipmentDTO) {
    return this.courierService.rate(rateData);
  }
}
