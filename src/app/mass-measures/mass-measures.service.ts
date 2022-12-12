import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MassMeasuresService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.mass_measures.findMany({
        select: {
          mass_measure_uuid: true,
          name: true,
        },
      });
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in fetching parcel measures data!',
      );
    }
  }
}
