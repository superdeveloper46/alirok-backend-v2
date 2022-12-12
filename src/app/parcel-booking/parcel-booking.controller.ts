import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import {
  NewCreateParcelBookingDTO,
  NewGetParcelBookingDataDTO,
} from './dto/new-parcel-booking.dto';
import { ParcelBookingService } from './parcel-booking.service';

@Controller('parcel-bookings')
export class ParcelBookingController {
  constructor(private readonly parcelBookingService: ParcelBookingService) {}

  @Post()
  async createParcelBooking(@Body() createParcel: NewCreateParcelBookingDTO) {
    return this.parcelBookingService.createParcelBooking(createParcel);
  }

  @Post(':uuid')
  async getParcelBooking(@Param() { uuid }: NewGetParcelBookingDataDTO) {
    return this.parcelBookingService.getParcelBookingData(uuid);
  }
}
