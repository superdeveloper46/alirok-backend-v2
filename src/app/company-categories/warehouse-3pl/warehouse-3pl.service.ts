import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateData } from './dto/warehouse-3pl.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class Warehouse3plService {
  private BUCKET_NAME: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.BUCKET_NAME = configService.get<string>('BUCKET_NAME');
  }

  async create(companyData: CreateData) {
    try {
      const duplicated = await this.prisma.warehouse_3pls.findFirst({
        where: { company_uuid: companyData.company_uuid },
      });

      if (duplicated) {
        throw new BadRequestException({
          message: 'Company type already created for this company',
        });
      }

      const warehouse3pl = await this.prisma.warehouse_3pls.create({
        data: { warehouse_3pl_uuid: uuidv4(), ...companyData },
      });
      return warehouse3pl;
    } catch (err) {
      return err;
    }
  }

  async delete(id: string) {
    try {
      const warehouse3pl = await this.prisma.warehouse_3pls.delete({
        where: { company_uuid: id },
      });
      return warehouse3pl;
    } catch (err) {
      return err;
    }
  }
}
