import { Module } from '@nestjs/common';
import { CorreiosService } from './correios.service';
import { CorreiosHelperModule } from './correios-helper/correios-helper.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [CorreiosService],
  imports: [CorreiosHelperModule, HttpModule],
  exports: [CorreiosService],
})
export class CorreiosModule {}
