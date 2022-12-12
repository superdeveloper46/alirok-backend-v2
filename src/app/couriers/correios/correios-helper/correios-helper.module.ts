import { Module } from '@nestjs/common';
import { FormattersModule } from 'src/app/misc/formatters/formatters.module';
import { FedexModule } from '../../fedex/fedex.module';
import { UpsModule } from '../../ups/ups.module';
import { UspsModule } from '../../usps/usps.module';
import { CorreiosHelperService } from './correios-helper.service';

@Module({
  providers: [CorreiosHelperService],
  imports: [FormattersModule, UpsModule, UspsModule, FedexModule],
  exports: [CorreiosHelperService],
})
export class CorreiosHelperModule {}
