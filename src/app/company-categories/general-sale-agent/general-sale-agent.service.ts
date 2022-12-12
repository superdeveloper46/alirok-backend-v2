import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateData } from './dto/general-sale-agent.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GeneralSaleAgentService {
  private BUCKET_NAME: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.BUCKET_NAME = configService.get<string>('BUCKET_NAME');
  }

  async create(companyData: CreateData) {
    try {
      const duplicated = await this.prisma.general_sale_agents.findFirst({
        where: { company_uuid: companyData.company_uuid },
      });

      if (duplicated) {
        throw new BadRequestException({
          message: 'Company type already created for this company',
        });
      }

      const gsa = await this.prisma.general_sale_agents.create({
        data: {
          general_sale_agent_uuid: uuidv4(),
          ...companyData,
        },
      });
      return gsa;
    } catch (err) {
      return err;
    }
  }

  async delete(id: string) {
    try {
      const gsa = await this.prisma.general_sale_agents.delete({
        where: { company_uuid: id },
      });
      return gsa;
    } catch (err) {
      return err;
    }
  }
}
