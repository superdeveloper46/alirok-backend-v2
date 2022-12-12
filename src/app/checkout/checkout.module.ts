import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';
import { CheckoutHelperModule } from './checkout-helper/checkout-helper.module';
import { ObjectHelperModule } from '../misc/object-helper/object-helper.module';
import { CouriersModule } from '../couriers/couriers.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [CheckoutService],
  controllers: [CheckoutController],
  imports: [
    CheckoutHelperModule,
    ObjectHelperModule,
    CouriersModule,
    HttpModule,
  ],
})
export class CheckoutModule {}
