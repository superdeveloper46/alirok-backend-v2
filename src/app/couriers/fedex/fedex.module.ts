import { Module } from '@nestjs/common';
import { FedexService } from './fedex.service';
import { FedexHelperModule } from './fedex-helper/fedex-helper.module';
import { HttpModule } from '@nestjs/axios';
import { S3Module } from '../../../vendors/s3/s3.module';
import { DocumentHelperModule } from 'src/app/misc/document-helper/document-helper.module';

@Module({
  providers: [FedexService],
  imports: [FedexHelperModule, HttpModule, S3Module, DocumentHelperModule],
  exports: [FedexService],
})
export class FedexModule {}
