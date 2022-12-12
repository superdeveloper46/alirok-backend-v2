import { profits } from '@generated/client';
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { FormattersService } from '../formatters/formatters.service';
import { IProfitWithDetails } from './interface/profit.interface';

@Injectable()
export class ProfitService {
  constructor(
    private prisma: PrismaService,
    private formatterService: FormattersService,
  ) {}

  public totalWithProfit(
    {
      modal,
      price,
      profit,
      courier,
    }: {
      modal: string;
      price: number;
      profit: profits;
      courier: string;
    },
    service: boolean,
    firstMile = false,
  ): number {
    try {
      if (!profit) {
        throw new BadRequestException('Profit not found!');
      }

      const fixed =
        courier === 'usps'.toLowerCase()
          ? 1
          : this.calculateFixedProfit(profit, firstMile);

      const sumOfProfitFixed = price + fixed;

      const percentage =
        courier === 'usps'.toLowerCase()
          ? 3 / 100
          : this.calculatedPercentageProfit(profit);

      const sumOfProfitPercentage = price + price * percentage;

      if (service) {
        return this.formatterService.roundAmount(sumOfProfitPercentage);
      }

      return sumOfProfitFixed >= sumOfProfitPercentage
        ? this.formatterService.roundAmount(sumOfProfitFixed)
        : this.formatterService.roundAmount(sumOfProfitPercentage);
    } catch (error) {
      return error;
    }
  }

  public totalWithProfitDetails(
    {
      modal,
      price,
      profit,
      courier,
    }: { modal: string; price: number; profit: profits; courier: string },
    service: boolean,
    firstMile = false,
  ): IProfitWithDetails {
    try {
      if (!profit) {
        throw new BadRequestException('Profit not found!');
      }

      const fixed =
        courier === 'usps'.toLowerCase()
          ? 1
          : this.calculateFixedProfit(profit, firstMile);

      const sumOfProfitFixed = price + fixed;

      const percentage =
        courier === 'usps'.toLowerCase()
          ? 3 / 100
          : this.calculatedPercentageProfit(profit);

      const sumOfProfitPercentage = price + price * percentage;

      let totalAmount = 0;
      if (service) {
        totalAmount = this.formatterService.roundAmount(sumOfProfitPercentage);
      } else {
        if (sumOfProfitFixed >= sumOfProfitPercentage) {
          totalAmount = this.formatterService.roundAmount(sumOfProfitFixed);
        } else {
          totalAmount = this.formatterService.roundAmount(
            sumOfProfitPercentage,
          );
        }
      }

      return {
        totalAmount,
        profitAmount: this.formatterService.roundAmount(totalAmount - price),
      };
    } catch (error) {
      return error;
    }
  }

  public async getProfitModal(modal: string): Promise<profits> {
    try {
      const profitModal = await this.prisma.profits.findFirst({
        where: { modals: { is: { name: modal } } },
      });

      if (!profitModal) {
        throw new BadGatewayException('Profit not found');
      }

      return profitModal;
    } catch (error) {
      return error;
    }
  }

  public calculateFixedProfit(profit: profits, firstMile = false) {
    if (typeof profit.fixed === 'number' && !firstMile) {
      return profit.fixed;
    }

    if (typeof profit.fixed === 'number' && firstMile) {
      return 1;
    }

    return 0;
  }

  public calculatedPercentageProfit(profit: profits) {
    if (typeof profit.percentage === 'number') {
      return profit.percentage / 100;
    }

    return 0;
  }
}
