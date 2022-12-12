import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MembersService } from './members.service';
import { FindAllDto } from './dto/findAll.dto';
import { FindMemberByIdDto } from './dto/findById.dto';
import { UpdateMemberDto } from './dto/updateMember.dto';
import { CurrentUser } from '../../../../common/decorator/current-user.decorator';
import { Roles } from '../../../../common/decorator/roles.decorator';
import { users } from '@generated/client';
import { CurrentCompany } from '../../../../common/decorator/current-company.decorator';

@Controller('customer/accounts/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Roles('user')
  @Get('searchMembers')
  findAll(
    @CurrentUser() currentUser: users,
    @CurrentCompany() currentCompany: string,
    @Query()
    query: FindAllDto,
  ) {
    return this.membersService.findMembers(currentUser, currentCompany, query);
  }

  @Get('searchByUuid')
  findMemberById(
    @Query()
    uuid: FindMemberByIdDto,
  ) {
    return this.membersService.findMemberById(uuid);
  }

  @Post('update/:uuid')
  updateMember(@Body() data: UpdateMemberDto, @Param('uuid') uuid: string) {
    return this.membersService.updateMember(uuid, data);
  }

  @Roles('user')
  @Get('ownerMembers')
  findAllOwnerMembers(
    @CurrentUser() currentUser: users,
    @CurrentCompany() currentCompany: string,
    @Query()
    query: FindAllDto,
  ) {
    return this.membersService.findOwnerMembers(
      currentUser,
      currentCompany,
      query,
    );
  }
}
