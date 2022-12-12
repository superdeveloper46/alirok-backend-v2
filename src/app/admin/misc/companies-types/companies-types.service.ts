import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { FindAllDto } from './dto/findAll.dto';

@Injectable()
export class CompaniesTypesService {
  constructor(private prisma: PrismaService) {}

  findAll(params: FindAllDto) {
    const { skip, take } = params;

    return this.prisma.company_types.findMany({
      skip,
      take,
      select: {
        company_type_uuid: true,
        name: true,
        companies: true,
      },
    });
  }
}
