import { Module } from '@nestjs/common';
import { PaymentMethodsHelperService } from './payment-methods-helper.service';

@Module({
  providers: [PaymentMethodsHelperService],
  exports: [PaymentMethodsHelperService],
})
export class PaymentMethodsHelperModule {}
