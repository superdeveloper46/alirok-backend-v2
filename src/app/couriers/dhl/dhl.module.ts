import { Module } from '@nestjs/common';
import { DhlService } from './dhl.service';
import { DhlController } from './dhl.controller';
import { DhlHelperModule } from './dhl-helper/dhl-helper.module';
import { HttpModule } from '@nestjs/axios';
import { DocumentHelperModule } from '../../misc/document-helper/document-helper.module';
import { S3Module } from '../../../vendors/s3/s3.module';

@Module({
  providers: [DhlService],
  controllers: [DhlController],
  imports: [DhlHelperModule, HttpModule, DocumentHelperModule, S3Module],
  exports: [DhlService],
})
export class DhlModule {}
