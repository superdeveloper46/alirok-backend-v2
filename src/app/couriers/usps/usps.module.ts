import { Module } from '@nestjs/common';
import { UspsService } from './usps.service';
import { UspsController } from './usps.controller';
import { UspsHelperModule } from './usps-helper/usps-helper.module';
import { HttpModule } from '@nestjs/axios';
import { S3Module } from '../../../vendors/s3/s3.module';

@Module({
  providers: [UspsService],
  controllers: [UspsController],
  imports: [UspsHelperModule, HttpModule, S3Module],
  exports: [UspsService],
})
export class UspsModule {}
