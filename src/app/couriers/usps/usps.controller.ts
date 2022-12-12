import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { RateShipmentDTO, RateShipmentReturnDTO } from '../dto/couriers.dto';
import { UspsService } from './usps.service';

@Controller('usps')
export class UspsController {
  constructor(private readonly uspsService: UspsService) {}

  //USPS rating already returns all available dropoffs locations
  // @Post('parcel/quote')
  // async rateUsps(@Body() rateData: RateShipmentDTO) {
  //   return this.uspsService.rate(rateData);
  // }

  // @Post('parcel/shipping')
  // async shippingUsps(@Body() labelData) {
  //   return this.uspsService.shipment(labelData);
  // }

  // @Get('parcel/tracking/:trackingNumber')
  // async trackingUps(@Param('trackingNumber') trackingNumber: string) {
  //   // return this.uspsService.tracking(trackingNumber);
  // }

  // @Delete('parcel/pickup')
  // async cancelPickup(@Body() labelData) {
  //   return this.uspsService.shipment(labelData);
  // }
}
