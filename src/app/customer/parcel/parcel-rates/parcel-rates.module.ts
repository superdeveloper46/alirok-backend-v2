import { Module } from '@nestjs/common';
import { ParcelRatesService } from './parcel-rates.service';
import { ParcelRatesController } from './parcel-rates.controller';

@Module({
  controllers: [ParcelRatesController],
  providers: [ParcelRatesService],
  imports: [],
})
export class ParcelRatesModule {}
