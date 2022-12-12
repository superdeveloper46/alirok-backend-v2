import { Module } from '@nestjs/common';
import { StripeModule } from './stripe/stripe.module';
import { SendgridModule } from './sendgrid/sendgrid.module';
import { S3Module } from './s3/s3.module';

@Module({
  imports: [StripeModule, SendgridModule, S3Module]
})
export class VendorsModule {}
