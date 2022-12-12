import { Module } from '@nestjs/common';
import { DocumentHelperModule } from 'src/app/misc/document-helper/document-helper.module';
import { FormattersModule } from 'src/app/misc/formatters/formatters.module';
import { FedexModule } from '../../fedex/fedex.module';
import { UpsModule } from '../../ups/ups.module';
import { UspsModule } from '../../usps/usps.module';
import { MailAmericasHelperService } from './mail-americas-helper.service';

@Module({
  providers: [MailAmericasHelperService],
  imports: [
    FormattersModule,
    FedexModule,
    UspsModule,
    UpsModule,
    DocumentHelperModule,
  ],
  exports: [MailAmericasHelperService],
})
export class MailAmericasHelperModule {}
