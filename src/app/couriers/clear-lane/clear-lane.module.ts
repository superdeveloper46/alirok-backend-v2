import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { S3Module } from 'src/vendors/s3/s3.module';
import { ClearLaneService } from './clear-lane.service';
import { ClearLaneHelperModule } from './clear-lane-helper/clear-lane-helper.module';

@Module({
  providers: [ClearLaneService],
  imports: [S3Module, HttpModule, ClearLaneHelperModule],
  exports: [ClearLaneService],
})
export class ClearLaneModule {}
