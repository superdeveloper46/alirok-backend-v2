import { Body, Controller, Param, Post, Put, Req } from '@nestjs/common';
import { Request } from 'express';
import { CheckoutService } from './checkout.service';
import { NewCheckoutParcelBookingDTO } from './dto/new-checkout.dto';

@Controller('parcel-checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('/checkout')
  async parcelCheckout(
    @Body() parcelBookingData: NewCheckoutParcelBookingDTO,
    @Req() request: Request,
  ) {
    return this.checkoutService.parcelCheckout(parcelBookingData, request);
  }

  @Post(':parcelBookingId/get')
  async getCheckoutData(@Param('parcelBookingId') parcelBookingId: string) {
    return this.checkoutService.retrieveCheckoutData(parcelBookingId);
  }
}
