import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CurrencyService {
  constructor(
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  async findAll() {
    return this.prisma.currencies.findMany();
  }

  async convertCurrencyRate(toCurrencyCode: string, fromCurrencyCode = 'USD') {
    try {
      const API_KEY = 'f211ed4bf8-53cd4a6742-r8jfr4';
      const data = await lastValueFrom(
        this.httpService.get(
          `https://api.fastforex.io/fetch-one?api_key=${API_KEY}&from=${fromCurrencyCode}&to=${toCurrencyCode}`,
        ),
      );

      const resultObj = data?.data?.result || undefined;

      if (resultObj.constructor === Object) {
        const convertedRate = Object.values(resultObj)?.[0] || undefined;

        if (typeof convertedRate === 'number') {
          return {
            rate: convertedRate,
            meta: {
              ...(data?.data || {}),
              fromCurrencyCode: fromCurrencyCode,
              toCurrencyCode: toCurrencyCode,
            },
          };
        } else {
          throw new Error('Invalid currency rate from API');
        }
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error) {
      const normalError =
        error?.message || 'Unknown error while fetching currency rate';

      const apiError = error?.response?.data?.error || normalError;

      throw new BadRequestException(apiError);
    }
  }
}
