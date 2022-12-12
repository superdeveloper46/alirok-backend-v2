import { Module } from '@nestjs/common';
import { GltHelperService } from './glt-helper.service';

@Module({
  providers: [GltHelperService],
  exports: [GltHelperService],
})
export class GltHelperModule {}
