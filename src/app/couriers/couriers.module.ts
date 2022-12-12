import { Module } from '@nestjs/common';
import { DhlModule } from './dhl/dhl.module';
import { UpsModule } from './ups/ups.module';
import { UspsModule } from './usps/usps.module';
import { CouriersService } from './couriers.service';
import { CouriersController } from './couriers.controller';
import { SkyPostalModule } from './sky-postal/sky-postal.module';
import { FedexModule } from './fedex/fedex.module';
import { SearchHelperModule } from '../misc/search-helper/search-helper.module';
import { ProfitModule } from '../misc/profit/profit.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { CorreiosModule } from './correios/correios.module';
import { BpsModule } from './bps/bps.module';
import { ClearLaneModule } from './clear-lane/clear-lane.module';
import { GltModule } from './glt/glt.module';
import { MailAmericasModule } from './mail-americas/mail-americas.module';
import { SendleModule } from './sendle/sendle.module';

@Module({
  imports: [
    DhlModule,
    UpsModule,
    UspsModule,
    SkyPostalModule,
    FedexModule,
    SearchHelperModule,
    ProfitModule,
    FeedbackModule,
    CorreiosModule,
    BpsModule,
    ClearLaneModule,
    GltModule,
    MailAmericasModule,
    SendleModule,
  ],
  providers: [CouriersService],
  controllers: [CouriersController],
  exports: [CouriersService],
})
export class CouriersModule {}
