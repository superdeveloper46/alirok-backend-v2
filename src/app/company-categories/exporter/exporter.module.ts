import { Module } from '@nestjs/common';
import { ExporterController } from './exporter.controller';
import { ExporterService } from './exporter.service';

@Module({
  providers: [ExporterService],
  controllers: [ExporterController],
  imports: [],
})
export class ExporterModule {}
