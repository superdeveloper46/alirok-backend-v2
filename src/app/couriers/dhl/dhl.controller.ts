import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  FindDropoffsDTO,
  FindDropoffsReturnDTO,
  RateShipmentDTO,
  RateShipmentReturnDTO,
} from '../dto/couriers.dto';
import { DhlService } from './dhl.service';

@Controller('dhl')
export class DhlController {
  constructor(private readonly dhlService: DhlService) {}

  // @Post('parcel/quote')
  // async rateDhl(@Body() rateData: RateShipmentDTO) {
  //   return this.dhlService.rate(rateData);
  // }

  @Get('parcel/drop-off-locations')
  async dropoffDhl(@Query() dropData: FindDropoffsDTO) {
    return this.dhlService.dropoff(dropData);
  }

  // @Post('parcel/tracking/:trackingNumber')
  // async trackingUps(@Param('trackingNumber') trackingNumber: string) {
  //   return this.dhlService.tracking(trackingNumber);
  // }
}
