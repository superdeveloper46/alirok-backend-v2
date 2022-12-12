import { Module } from '@nestjs/common';
import { ImporterController } from './importer.controller';
import { ImporterService } from './importer.service';

@Module({
  providers: [ImporterService],
  controllers: [ImporterController],
  imports: [],
})
export class ImporterModule {}
