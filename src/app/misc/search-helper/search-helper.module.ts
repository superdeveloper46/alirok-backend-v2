import { Module } from '@nestjs/common';
import { SearchHelperService } from './search-helper.service';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  providers: [SearchHelperService, PrismaService],
  exports: [SearchHelperService],
})
export class SearchHelperModule {}
