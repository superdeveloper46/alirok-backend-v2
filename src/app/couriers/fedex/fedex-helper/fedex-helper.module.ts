import { Module } from '@nestjs/common';
import { FormattersModule } from '../../../../app/misc/formatters/formatters.module';
import { FedexHelperService } from './fedex-helper.service';

@Module({
  providers: [FedexHelperService],
  exports: [FedexHelperService],
  imports: [FormattersModule],
})
export class FedexHelperModule {}
