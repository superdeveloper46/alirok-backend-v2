import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';
import { FindAllHtsDto } from './dto/find-all-hts.dto';

@Injectable()
export class HtsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FindAllHtsDto) {
    const { skip, take, orderBy, sortOrder, term } = query;

    return this.prisma.hts_codes.findMany({
      skip: skip && +skip,
      take: take && +take,
      orderBy: orderBy && {
        [orderBy]: sortOrder || 'asc',
      },
      where: {
        OR: [
          { htsno: { contains: term || '', mode: 'insensitive' } },
          { description: { contains: term || '', mode: 'insensitive' } },
        ],
      },
    });
  }

  async findAllDefault(query: FindAllHtsDto) {
    const { skip, take, orderBy, sortOrder, term } = query;

    return this.prisma.hts_codes_default.findMany({
      skip: skip && +skip,
      take: take && +take,
      orderBy: orderBy && {
        [orderBy]: sortOrder || 'asc',
      },
      where: {
        OR: [
          { hts_code: { contains: term || '', mode: 'insensitive' } },
          { description: { contains: term || '', mode: 'insensitive' } },
          { short_description: { contains: term || '', mode: 'insensitive' } },
        ],
      },
    });
  }
}
