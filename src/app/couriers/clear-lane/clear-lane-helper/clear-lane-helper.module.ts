import { Module } from '@nestjs/common';
import { ClearLaneHelperService } from './clear-lane-helper.service';

@Module({
  providers: [ClearLaneHelperService],
  exports: [ClearLaneHelperService],
})
export class ClearLaneHelperModule {}
