import { Module } from '@nestjs/common';
import { ParcelBookingController } from './parcel-booking.controller';
import { ParcelBookingService } from './parcel-booking.service';
import { ParcelBookingHelperModule } from './parcel-booking-helper/parcel-booking-helper.module';
import { AddressModule } from '../../common/address/address.module';

@Module({
  controllers: [ParcelBookingController],
  providers: [ParcelBookingService],
  imports: [ParcelBookingHelperModule, AddressModule],
  exports: [ParcelBookingService],
})
export class ParcelBookingModule {}
