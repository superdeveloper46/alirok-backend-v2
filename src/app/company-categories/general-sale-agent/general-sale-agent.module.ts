import { Module } from '@nestjs/common';
import { GeneralSaleAgentController } from './general-sale-agent.controller';
import { GeneralSaleAgentService } from './general-sale-agent.service';

@Module({
  providers: [GeneralSaleAgentService],
  controllers: [GeneralSaleAgentController],
  imports: [],
})
export class GeneralSaleAgentModule {}
