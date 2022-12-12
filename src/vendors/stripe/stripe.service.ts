import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripeKey: string;
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    this.stripeKey = configService.get('STRIPE_API_SK');
    this.stripe = new Stripe(this.stripeKey, {
      typescript: true,
      apiVersion: '2020-08-27',
    });
  }

  public async createPaymentIntent(
    intentBody: Stripe.PaymentIntentCreateParams,
  ) {
    const paymentIntentsBody: Stripe.PaymentIntentCreateParams = intentBody;

    return await this.stripe.paymentIntents.create(paymentIntentsBody);
  }

  public async createCustomer() {
    return await this.stripe.customers.create();
  }

  public async updatePaymentIntent({
    paymentId,
    description,
  }: {
    paymentId: string;
    description: string;
  }) {
    return await this.stripe.paymentIntents.update(paymentId, { description });
  }

  public async confirmPayment({
    paymentIntentId,
    paymentMethodId,
  }: {
    paymentIntentId: string;
    paymentMethodId: string;
  }) {
    return await this.stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
  }
}
