import { Module } from '@nestjs/common';
import { DhlModule } from '../../couriers/dhl/dhl.module';
import { UpsModule } from '../../couriers/ups/ups.module';
import { SendleModule } from '../../couriers/sendle/sendle.module';
import { UspsModule } from '../../couriers/usps/usps.module';
import { AddressModule } from '../../../common/address/address.module';
import { StripeModule } from '../../../vendors/stripe/stripe.module';
import { ParcelBookingHelperService } from './parcel-booking-helper.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { SkyPostalModule } from '../../../app/couriers/sky-postal/sky-postal.module';
import { ProfitModule } from '../../../app/misc/profit/profit.module';
import { FedexModule } from '../../../app/couriers/fedex/fedex.module';
import { ClearLaneModule } from 'src/app/couriers/clear-lane/clear-lane.module';
import { BpsModule } from 'src/app/couriers/bps/bps.module';
import { CorreiosModule } from 'src/app/couriers/correios/correios.module';
import { GltModule } from 'src/app/couriers/glt/glt.module';
import { MailAmericasModule } from 'src/app/couriers/mail-americas/mail-americas.module';

@Module({
  providers: [ParcelBookingHelperService],
  imports: [
    StripeModule,
    AddressModule,
    UpsModule,
    UspsModule,
    DhlModule,
    SendleModule,
    FedexModule,
    ClearLaneModule,
    SkyPostalModule,
    PrismaModule,
    BpsModule,
    CorreiosModule,
    GltModule,
    MailAmericasModule,
    ProfitModule,
  ],
  exports: [ParcelBookingHelperService],
})
export class ParcelBookingHelperModule {}
