import { Module } from '@nestjs/common';
import { ParcelMassMeasuresController } from './parcel-mass-measures.controller';
import { ParcelMassMeasuresService } from './parcel-mass-measures.service';

@Module({
  controllers: [ParcelMassMeasuresController],
  providers: [ParcelMassMeasuresService],
})
export class ParcelMassMeasuresModule {}
