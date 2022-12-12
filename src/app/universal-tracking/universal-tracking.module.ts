import { Global, Module } from '@nestjs/common';
import { UniversalTrackingService } from './universal-tracking.service';
import { UniversalTrackingController } from './universal-tracking.controller';
import { DhlModule } from '../couriers/dhl/dhl.module';
import { UpsModule } from '../couriers/ups/ups.module';
import { SkyPostalModule } from '../couriers/sky-postal/sky-postal.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { FedexModule } from '../couriers/fedex/fedex.module';

@Module({
  providers: [UniversalTrackingService],
  controllers: [UniversalTrackingController],
  imports: [DhlModule, UpsModule, SkyPostalModule, PrismaModule, FedexModule],
  exports: [UniversalTrackingService],
})
export class UniversalTrackingModule {}
