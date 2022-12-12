import { Module } from '@nestjs/common';
import { FormattersModule } from 'src/app/misc/formatters/formatters.module';
import { FedexModule } from '../../fedex/fedex.module';
import { UpsModule } from '../../ups/ups.module';
import { UspsModule } from '../../usps/usps.module';
import { BpsHelperService } from './bps-helper.service';

@Module({
  providers: [BpsHelperService],
  exports: [BpsHelperService],
  imports: [FormattersModule, UpsModule, UspsModule, FedexModule],
})
export class BpsHelperModule {}
