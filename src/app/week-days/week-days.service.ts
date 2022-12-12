import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WeekDaysService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const locationReferenceTypeData = await this.prisma.week_days.findMany({
        select: {
          week_day_uuid: true,
          name: true,
        },
      });
      return locationReferenceTypeData;
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in fetching week days data!',
      );
    }
  }
}
