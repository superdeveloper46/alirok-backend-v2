import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { FedexModule } from '../../fedex/fedex.module';
import { UpsModule } from '../../ups/ups.module';
import { UspsModule } from '../../usps/usps.module';
import { SkyPostalHelperService } from './sky-postal-helper.service';

@Module({
  providers: [SkyPostalHelperService],
  exports: [SkyPostalHelperService],
  imports: [UspsModule, UpsModule, FedexModule, HttpModule],
})
export class SkyPostalHelperModule {}
