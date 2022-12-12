import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { ProfitService } from '../misc/profit/profit.service';
@Module({
  controllers: [AccountController],
  providers: [AccountService, ProfitService],
  imports: [],
})
export class AccountModule {}
