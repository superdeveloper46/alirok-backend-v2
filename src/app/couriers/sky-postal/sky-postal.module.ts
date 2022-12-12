import { Module } from '@nestjs/common';
import { SkyPostalService } from './sky-postal.service';
import { SkyPostalHelperModule } from './sky-postal-helper/sky-postal-helper.module';
import { FormattersModule } from '../../../app/misc/formatters/formatters.module';
import { DocumentHelperModule } from '../../../app/misc/document-helper/document-helper.module';
import { HttpModule } from '@nestjs/axios';
import { UpsModule } from '../ups/ups.module';
import { S3Module } from '../../../vendors/s3/s3.module';
import { UspsModule } from '../usps/usps.module';
import { FormattersService } from 'src/app/misc/formatters/formatters.service';
import { FedexModule } from '../fedex/fedex.module';

@Module({
  imports: [
    SkyPostalHelperModule,
    FormattersModule,
    HttpModule,
    DocumentHelperModule,
    UpsModule,
    S3Module,
    UspsModule,
    FormattersService,
    FedexModule,
  ],
  providers: [SkyPostalService],
  exports: [SkyPostalService],
})
export class SkyPostalModule {}
