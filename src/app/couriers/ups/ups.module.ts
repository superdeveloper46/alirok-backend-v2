import { Module } from '@nestjs/common';
import { UpsController } from './ups.controller';
import { UpsService } from './ups.service';
import { UpsHelperModule } from './ups-helper/ups-helper.module';
import { HttpModule } from '@nestjs/axios';
import { S3Module } from '../../../vendors/s3/s3.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [UpsController],
  providers: [UpsService],
  imports: [UpsHelperModule, HttpModule, S3Module, PrismaModule],
  exports: [UpsService],
})
export class UpsModule {}
