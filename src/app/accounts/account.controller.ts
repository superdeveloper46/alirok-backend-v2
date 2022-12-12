import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { users } from '@generated/client';
import { AccountService } from './account.service';
import {
  UpdateParcelBookingStatusTypesDTO,
  UpdateParcelBookingStatusPayloadDTO,
} from './dto/accounts.dto';
import { AccountServiceType } from './interface/account.interface';
import { Roles } from '../../common/decorator/roles.decorator';
import { CurrentUser } from '../../common/decorator/current-user.decorator';

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Roles('user')
  @Get('payables')
  payable(@CurrentUser() currentUser: users) {
    return this.accountService.findAllPayableAndReceivable(
      AccountServiceType.PAYABLE,
      currentUser,
    );
  }

  @Roles('user')
  @Get('receivable')
  receivable(@CurrentUser() currentUser: users) {
    return this.accountService.findAllPayableAndReceivable(
      AccountServiceType.RECEIVABLE,
      currentUser,
    );
  }

  @Roles('user')
  @Put('update/status/:statusType')
  updateParcelBookingStatus(
    @Body() payload: UpdateParcelBookingStatusPayloadDTO,
    @Param() { statusType }: UpdateParcelBookingStatusTypesDTO,
  ) {
    return this.accountService.updateParcelBookingStatus(payload, statusType);
  }
}
