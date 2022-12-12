import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { FindDropoffsDTO, RateShipmentDTO } from '../dto/couriers.dto';
import { UpsService } from './ups.service';

@Controller('ups')
export class UpsController {
  constructor(private readonly upsService: UpsService) {}

  // @Post('parcel/quote')
  // async rateUps(@Body() rateData: RateShipmentDTO) {
  //   return this.upsService.rate(rateData);
  // }

  @Get('parcel/drop-off-locations')
  async dropoffUps(@Query() dropData: FindDropoffsDTO) {
    return this.upsService.dropoff(dropData);
  }

  // @Post('parcel/tracking/:trackingNumber')
  // async trackingUps(@Param('trackingNumber') trackingNumber: string) {
  //   return this.upsService.tracking(trackingNumber);
  // }
}
