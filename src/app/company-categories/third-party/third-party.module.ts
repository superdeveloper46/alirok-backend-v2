import { Module } from '@nestjs/common';
import { ThirdPartyController } from './third-party.controller';
import { ThirdPartyService } from './third-party.service';

@Module({
  providers: [ThirdPartyService],
  controllers: [ThirdPartyController],
  imports: [],
})
export class ThirdPartyModule {}
