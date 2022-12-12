import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CompaniesCarriersService {
  constructor(private prisma: PrismaService) {}

  async findCarriers(currentCompany: string) {
    try {
      const companies = await this.prisma.company_relationships.findMany({
        where: {
          customer_company_uuid: currentCompany,
          active: true,
        },
        select: {
          companies_companiesTocompany_relationships_vendor_company_uuid: true,
        },
      });

      const carriers = await this.prisma.unregistered_companies.findMany();

      return {
        companies: companies.map((row) => ({
          company_uuid:
            row.companies_companiesTocompany_relationships_vendor_company_uuid
              .company_uuid,
          logo: row
            .companies_companiesTocompany_relationships_vendor_company_uuid
            .logo,
          name: row
            .companies_companiesTocompany_relationships_vendor_company_uuid
            .legal_name,
        })),
        unregistered_companies: carriers,
      };
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in fetching week days data!',
      );
    }
  }
}
