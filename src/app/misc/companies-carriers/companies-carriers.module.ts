import { Module } from '@nestjs/common';
import { CompaniesCarriersController } from './companies-carriers.controller';
import { CompaniesCarriersService } from './companies-carriers.service';

@Module({
  controllers: [CompaniesCarriersController],
  providers: [CompaniesCarriersService]
})
export class CompaniesCarriersModule {}
