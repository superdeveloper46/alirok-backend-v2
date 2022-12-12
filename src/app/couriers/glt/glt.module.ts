import { Module } from '@nestjs/common';
import { GltService } from './glt.service';
import { GltHelperModule } from './glt-helper/glt-helper.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [GltService],
  imports: [GltHelperModule, HttpModule],
  exports: [GltService],
})
export class GltModule {}
