import { Module } from '@nestjs/common';
import { BpsService } from './bps.service';
import { BpsHelperModule } from './bps-helper/bps-helper.module';
import { S3Module } from 'src/vendors/s3/s3.module';
import { HttpModule } from '@nestjs/axios';
import { DocumentHelperModule } from 'src/app/misc/document-helper/document-helper.module';
import { FormattersModule } from 'src/app/misc/formatters/formatters.module';
import { UpsModule } from '../ups/ups.module';
import { FedexModule } from '../fedex/fedex.module';
import { UspsModule } from '../usps/usps.module';

@Module({
  providers: [BpsService],
  imports: [
    BpsHelperModule,
    S3Module,
    HttpModule,
    DocumentHelperModule,
    FormattersModule,
    UpsModule,
    FedexModule,
    UspsModule,
  ],
  exports: [BpsService],
})
export class BpsModule {}
