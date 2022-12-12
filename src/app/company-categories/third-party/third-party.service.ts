import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateData } from './dto/third-party.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ThirdPartyService {
  private BUCKET_NAME: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.BUCKET_NAME = configService.get<string>('BUCKET_NAME');
  }

  async create(companyData: CreateData) {
    try {
      const duplicated = await this.prisma.third_parties.findFirst({
        where: { company_uuid: companyData.company_uuid },
      });

      if (duplicated) {
        throw new BadRequestException({
          message: 'Company type already created for this company',
        });
      }

      const third_party = await this.prisma.third_parties.create({
        data: {
          third_party_uuid: uuidv4(),
          ...companyData,
        },
      });
      return third_party;
    } catch (err) {
      return err;
    }
  }

  async delete(id: string) {
    try {
      const third_party = await this.prisma.third_parties.delete({
        where: { company_uuid: id },
      });
      return third_party;
    } catch (err) {
      return err;
    }
  }
}
