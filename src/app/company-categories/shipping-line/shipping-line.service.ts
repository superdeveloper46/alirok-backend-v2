import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateData } from './dto/shipping-line.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ShippingLineService {
  private BUCKET_NAME: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.BUCKET_NAME = configService.get<string>('BUCKET_NAME');
  }

  async create(companyData: CreateData) {
    try {
      const duplicated = await this.prisma.shipping_lines.findFirst({
        where: { company_uuid: companyData.company_uuid },
      });

      if (duplicated) {
        throw new BadRequestException({
          message: 'Company type already created for this company',
        });
      }

      const shipping_line = await this.prisma.shipping_lines.create({
        data: {
          shipping_line_uuid: uuidv4(),
          ...companyData,
        },
      });
      return shipping_line;
    } catch (err) {
      return err;
    }
  }

  async delete(id: string) {
    try {
      const shipping_line = await this.prisma.shipping_lines.delete({
        where: { company_uuid: id },
      });
      return shipping_line;
    } catch (err) {
      return err;
    }
  }
}
