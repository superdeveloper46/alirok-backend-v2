import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { AddressModule } from '../../../misc/address/address.module';
import { S3Module } from '../../../../vendors/s3/s3.module';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService],
  imports: [AddressModule, S3Module],
})
export class CompaniesModule {}
