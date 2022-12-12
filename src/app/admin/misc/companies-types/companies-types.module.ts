import { Module } from '@nestjs/common';
import { CompaniesTypesService } from './companies-types.service';
import { CompaniesTypesController } from './companies-types.controller';

@Module({
  controllers: [CompaniesTypesController],
  providers: [CompaniesTypesService],
  imports: [],
})
export class CompaniesTypesModule {}
