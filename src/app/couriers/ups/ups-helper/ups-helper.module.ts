import { Module } from '@nestjs/common';
import { DocumentHelperModule } from '../../../misc/document-helper/document-helper.module';
import { FormattersModule } from '../../../misc/formatters/formatters.module';
import { UpsHelperService } from './ups-helper.service';

@Module({
  providers: [UpsHelperService],
  exports: [UpsHelperService],
  imports: [FormattersModule, DocumentHelperModule],
})
export class UpsHelperModule {}
