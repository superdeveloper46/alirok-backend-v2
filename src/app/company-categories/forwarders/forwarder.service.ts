import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateData } from './dto/forwarder.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ForwarderService {
  private BUCKET_NAME: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.BUCKET_NAME = configService.get<string>('BUCKET_NAME');
  }

  async create(companyData: CreateData) {
    try {
      const duplicated = await this.prisma.forwarders.findFirst({
        where: { company_uuid: companyData.company_uuid },
      });

      if (duplicated) {
        throw new BadRequestException({
          message: 'Company type already created for this company',
        });
      }

      const forwarder = await this.prisma.forwarders.create({
        data: {
          forwarder_uuid: uuidv4(),
          ...companyData,
        },
      });
      return forwarder;
    } catch (err) {
      return err;
    }
  }

  async delete(id: string) {
    try {
      const forwarder = await this.prisma.forwarders.delete({
        where: { company_uuid: id },
      });
      return forwarder;
    } catch (err) {
      return err;
    }
  }
}
