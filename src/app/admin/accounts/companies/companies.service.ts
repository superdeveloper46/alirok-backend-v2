import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { FindAllDto } from './dto/findAll.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  findByCategory(id: string, query: FindAllDto) {
    const { skip, take, orderBy, sortOrder } = query;

    return this.prisma.companies.findMany({
      skip: skip && +skip,
      take: take && +take,
      orderBy: orderBy && {
        [orderBy]: sortOrder || 'asc',
      },
      where: {
        company_type_uuid: id,
      },
      include: {
        users: true,
        company_types: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.companies.findUnique({
      where: { company_uuid: id },
      include: {
        users: true,
        company_types: true,
      },
    });
  }
}
