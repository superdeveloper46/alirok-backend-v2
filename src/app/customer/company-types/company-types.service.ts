import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { CompanyTypeDto } from './dto/company-type.dto';

@Injectable()
export class CompanyTypesService {
  constructor(private prisma: PrismaService) {}

  public async findAll() {
    try {
      return await this.prisma.company_types.findMany();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  public async createCompanyType(companyType: CompanyTypeDto) {
    const duplicated = await this.prisma.company_types.findUnique({
      where: {
        name: companyType.name,
      },
    });

    if (duplicated) {
      throw new BadRequestException('This company type already exists!');
    }

    const createdCompanyType = await this.prisma.company_types.create({
      data: {
        display: companyType.display,
        name: companyType.name,
        company_type_uuid: uuidv4(),
      },
    });

    return createdCompanyType;
  }

  public async updateCompanyType(id: string, companyType: CompanyTypeDto) {
    const updatedCompanyType = await this.prisma.company_types.update({
      where: {
        company_type_uuid: id,
      },
      data: {
        name: companyType.name,
        display: companyType.display,
      },
    });

    return updatedCompanyType;
  }

  public async deleteCompanyType(uuid: string) {
    return await this.prisma.company_types.delete({
      where: {
        company_type_uuid: uuid,
      },
    });
  }
}
