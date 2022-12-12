import { Module } from '@nestjs/common';
import { MassMeasuresController } from './mass-measures.controller';
import { MassMeasuresService } from './mass-measures.service';

@Module({
  controllers: [MassMeasuresController],
  providers: [MassMeasuresService]
})
export class MassMeasuresModule {}
