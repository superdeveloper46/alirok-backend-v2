import { Module } from '@nestjs/common';
import { ObjectHelperService } from './object-helper.service';

@Module({
  providers: [ObjectHelperService],
  exports: [ObjectHelperService],
})
export class ObjectHelperModule {}
