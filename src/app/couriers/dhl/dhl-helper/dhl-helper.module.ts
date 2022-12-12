import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { DhlHelperService } from './dhl-helper.service';

@Module({
  providers: [DhlHelperService],
  exports: [DhlHelperService],
  imports: [HttpModule],
})
export class DhlHelperModule {}
