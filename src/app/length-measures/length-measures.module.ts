import { Module } from '@nestjs/common';
import { LengthMeasuresController } from './length-measures.controller';
import { LengthMeasuresService } from './length-measures.service';

@Module({
  controllers: [LengthMeasuresController],
  providers: [LengthMeasuresService]
})
export class LengthMeasuresModule {}
