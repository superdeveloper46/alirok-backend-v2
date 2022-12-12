import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ParcelMassMeasuresService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const locationReferenceTypeData =
        await this.prisma.parcel_mass_measures.findMany({
          select: {
            parcel_mass_measure_uuid: true,
            name: true,
          },
        });
      return locationReferenceTypeData;
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in fetching parcel mass measures data!',
      );
    }
  }
}
