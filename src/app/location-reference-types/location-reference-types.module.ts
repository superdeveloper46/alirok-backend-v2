import { Module } from '@nestjs/common';
import { LocationReferenceTypesController } from './location-reference-types.controller';
import { LocationReferenceTypesService } from './location-reference-types.service';

@Module({
  controllers: [LocationReferenceTypesController],
  providers: [LocationReferenceTypesService],
})
export class LocationReferenceTypesModule {}
