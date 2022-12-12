import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LocationReferenceTypesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const locationReferenceTypeData =
        await this.prisma.location_reference_types.findMany({
          select: {
            location_reference_type_uuid: true,
            name: true,
          },
        });
      return locationReferenceTypeData;
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in fetching location reference type data!',
      );
    }
  }
}
