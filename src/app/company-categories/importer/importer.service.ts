import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateData } from './dto/importer.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImporterService {
  private BUCKET_NAME: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.BUCKET_NAME = configService.get<string>('BUCKET_NAME');
  }

  async create(companyData: CreateData) {
    try {
      const duplicated = await this.prisma.importers.findFirst({
        where: { company_uuid: companyData.company_uuid },
      });

      if (duplicated) {
        throw new BadRequestException({
          message: 'Company type already created for this company',
        });
      }

      const importer = await this.prisma.importers.create({
        data: {
          importer_uuid: uuidv4(),
          ...companyData,
        },
      });
      return importer;
    } catch (err) {
      return err;
    }
  }

  async delete(id: string) {
    try {
      const importer = await this.prisma.importers.delete({
        where: { company_uuid: id },
      });
      return importer;
    } catch (err) {
      return err;
    }
  }
}
