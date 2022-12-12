import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateData } from './dto/airline.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AirlineService {
  private BUCKET_NAME: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.BUCKET_NAME = configService.get<string>('BUCKET_NAME');
  }

  async create(companyData: CreateData) {
    try {
      const duplicated = await this.prisma.airlines.findFirst({
        where: { company_uuid: companyData.company_uuid },
      });

      if (duplicated) {
        throw new BadRequestException({
          message: 'Company type already created for this company',
        });
      }

      const airline = await this.prisma.airlines.create({
        data: {
          airline_uuid: uuidv4(),
          ...companyData,
        },
      });
      return airline;
    } catch (err) {
      return err;
    }
  }

  async delete(id: string) {
    try {
      const airline = await this.prisma.airlines.delete({
        where: { company_uuid: id },
      });
      return airline;
    } catch (err) {
      return err;
    }
  }
}
