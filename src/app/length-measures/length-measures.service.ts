import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LengthMeasuresService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.length_measures.findMany({
        select: {
          length_measure_uuid: true,
          name: true,
        },
      });
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in fetching length measures data!',
      );
    }
  }
}
