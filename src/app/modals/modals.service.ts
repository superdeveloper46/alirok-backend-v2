import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ModalsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.modals.findMany({
        where: {
          name: {
            not: 'First_Mile',
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in fetching modals data!',
      );
    }
  }
}
