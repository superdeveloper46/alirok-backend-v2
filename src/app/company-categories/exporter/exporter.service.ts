import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateData } from './dto/exporter.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ExporterService {
  private BUCKET_NAME: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.BUCKET_NAME = configService.get<string>('BUCKET_NAME');
  }

  async create(companyData: CreateData) {
    try {
      const duplicated = await this.prisma.exporters.findFirst({
        where: { company_uuid: companyData.company_uuid },
      });

      if (duplicated) {
        throw new BadRequestException({
          message: 'Company type already created for this company',
        });
      }

      const exporter = await this.prisma.exporters.create({
        data: {
          exporter_uuid: uuidv4(),
          ...companyData,
        },
      });
      return exporter;
    } catch (err) {
      return err;
    }
  }

  async delete(id: string) {
    try {
      const exporter = await this.prisma.exporters.delete({
        where: { company_uuid: id },
      });
      return exporter;
    } catch (err) {
      return err;
    }
  }
}
