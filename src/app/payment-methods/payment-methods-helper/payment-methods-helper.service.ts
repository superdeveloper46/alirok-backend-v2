import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PaymentMethodsHelperService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPaymentMethods(user_uuid: string) {
    try {
      const methods = await this.prisma.payment_methods.findMany({
        where: { user_uuid },
      });

      return methods;
    } catch (error) {
      throw error;
    }
  }
}
