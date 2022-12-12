import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async health() {
    let result = 'Ok';

    try {
      // Check the DB connection
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      result = error.message;
    }

    return {
      status: result,
    };
  }
}
