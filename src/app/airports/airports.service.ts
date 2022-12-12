import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FindAllDto } from './dto/airports.dto';

@Injectable()
export class AirportsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FindAllDto) {
    try {
      let whereCondition = {};

      if (query.search) {
        whereCondition = {
          OR: [
            {iata_code: {
              contains: query.search || '',
              mode: 'insensitive',
            }},
            {name: {
              contains: query.search || '',
              mode: 'insensitive',
            }},
            {location: {
              contains: query.search || '',
              mode: 'insensitive',
            }}
          ],          
        };
      }

      const locationReferenceTypeData = await this.prisma.airports.findMany({
        where: { ...whereCondition },
        select: {
          airport_uuid: true,
          country_uuid: true,
          iata_code: true,
          location: true,
          name: true,
        },
        take: query.limit ? query.limit : 30,
      });
      return locationReferenceTypeData;
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in fetching airports data!',
      );
    }
  }
}
