import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PortsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      const locationReferenceTypeData = await this.prisma.ports.findMany({
        select: {
          code: true,
          country_uuid: true,
          latitude: true,
          location: true,
          longitude: true,
          port_uuid: true,
          name: true,
        },
      });
      return locationReferenceTypeData;
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in fetching ports data!',
      );
    }
  }
}
