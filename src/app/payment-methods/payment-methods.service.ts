import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentMethodsHelperService } from './payment-methods-helper/payment-methods-helper.service';

@Injectable()
export class PaymentMethodsService {
  constructor(
    private readonly paymentMethodsHelper: PaymentMethodsHelperService,
  ) {}

  async getPaymentMethods(user_uuid: string) {
    try {
      const allMethods =
        this.paymentMethodsHelper.findAllPaymentMethods(user_uuid);

      return allMethods;
    } catch (error) {
      throw error;
    }
  }

  async storePaymentMethod(user_uuid: string, storeData) {}

  async updatePaymentMethod(user_uuid: string, updateData) {}

  async deletePaymentMethod(user_uuid: string, deleteData) {}
}
