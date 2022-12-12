import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { FormattersModule } from '../../../../../src/app/misc/formatters/formatters.module';
import { ParcelRatesResultsIntegrationService } from './parcel-rates-results-integration.service';

@Module({
  providers: [ParcelRatesResultsIntegrationService],
  exports: [ParcelRatesResultsIntegrationService],
  imports: [FormattersModule, HttpModule],
})
export class ParcelRatesResultsIntegrationModule {}
