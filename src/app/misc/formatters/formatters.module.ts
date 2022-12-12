import { Global, Module } from '@nestjs/common';
import { FormattersService } from './formatters.service';

@Global()
@Module({
  providers: [FormattersService],
  exports: [FormattersService],
})
export class FormattersModule {}
