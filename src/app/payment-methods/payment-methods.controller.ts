import { Controller, Get, Post, Query } from '@nestjs/common';
import { GetPaymentMethodsDTO } from './dto/payment-methods.dto';
import { PaymentMethodsService } from './payment-methods.service';

@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  async retrievePaymentMethods(@Query() { user_uuid }: GetPaymentMethodsDTO) {
    return await this.paymentMethodsService.getPaymentMethods(user_uuid);
  }
}
