import { Module } from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentMethodsHelperModule } from './payment-methods-helper/payment-methods-helper.module';

@Module({
  providers: [PaymentMethodsService],
  controllers: [PaymentMethodsController],
  imports: [PaymentMethodsHelperModule],
})
export class PaymentMethodsModule {}
