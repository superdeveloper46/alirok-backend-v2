import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CoveragesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const coveragesData = await this.prisma.coverages.findMany({
        select: {
          coverage_uuid: true,
          name: true,
        },
      });
      return coveragesData;
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in fetching coverages data!',
      );
    }
  }
}
