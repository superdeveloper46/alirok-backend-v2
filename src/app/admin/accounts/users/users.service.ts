import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { FindAllDto } from './dto/findAll.dto';
import { FindByCompanyDto } from './dto/findByCompany.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByCompany(id: string, params: FindByCompanyDto) {
    const { skip, take, orderBy, sortOrder } = params;

    return this.prisma.users.findMany({
      skip: skip && +skip,
      take: take && +take,
      orderBy: orderBy && {
        [orderBy]: sortOrder || 'asc',
      },
      where: {
        companies: {
          some: {
            company_uuid: id,
          },
        },
      },
    });
  }

  async findAll(params: FindAllDto) {
    const { skip, take, orderBy, sortOrder, onlyWithoutCompanies } = params;

    return await this.prisma.users.findMany({
      skip: skip && +skip,
      take: take && +take,
      orderBy: orderBy && {
        [orderBy]: sortOrder || 'asc',
      },
      where: {
        ...(onlyWithoutCompanies
          ? {
              companies: {
                none: {},
              },
            }
          : {}),
      },
      include: {
        companies: true,
      },
    });
  }

  findOne(id: string) {
    return this.prisma.users.findUnique({
      where: { user_uuid: id },
      include: { companies: true },
    });
  }

  disableAccount(id: string) {
    return this.prisma.users.update({
      where: { user_uuid: id },
      data: { account_activate: false },
    });
  }

  activateAccount(id: string) {
    return this.prisma.users.update({
      where: { user_uuid: id },
      data: { account_activate: true },
    });
  }
}
