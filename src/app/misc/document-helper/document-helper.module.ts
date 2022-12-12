import { Module } from '@nestjs/common';
import { DocumentHelperService } from './document-helper.service';

@Module({
  providers: [DocumentHelperService],
  exports: [DocumentHelperService],
})
export class DocumentHelperModule {}
