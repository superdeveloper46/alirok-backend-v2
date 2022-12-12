import { Module } from '@nestjs/common';
import { SendgridModule } from '../../../vendors/sendgrid/sendgrid.module';
import { AddressModule } from '../../../app/misc/address/address.module';
import { StripeModule } from '../../../vendors/stripe/stripe.module';
import { CheckoutHelperService } from './checkout-helper.service';
import { DhlModule } from '../../../app/couriers/dhl/dhl.module';
import { UspsModule } from '../../../app/couriers/usps/usps.module';
import { UpsModule } from '../../../app/couriers/ups/ups.module';
import { ObjectHelperModule } from '../../../app/misc/object-helper/object-helper.module';
import { SkyPostalModule } from '../../../app/couriers/sky-postal/sky-postal.module';
import { S3Module } from '../../../vendors/s3/s3.module';
import { FedexModule } from '../../../app/couriers/fedex/fedex.module';
import { BpsModule } from 'src/app/couriers/bps/bps.module';
import { GltModule } from 'src/app/couriers/glt/glt.module';
import { ClearLaneModule } from 'src/app/couriers/clear-lane/clear-lane.module';
import { MailAmericasModule } from 'src/app/couriers/mail-americas/mail-americas.module';

@Module({
  providers: [CheckoutHelperService],
  exports: [CheckoutHelperService],
  imports: [
    AddressModule,
    FedexModule,
    StripeModule,
    SendgridModule,
    DhlModule,
    UspsModule,
    UpsModule,
    BpsModule,
    GltModule,
    MailAmericasModule,
    ClearLaneModule,
    SkyPostalModule,
    ObjectHelperModule,
    S3Module,
  ],
})
export class CheckoutHelperModule {}
