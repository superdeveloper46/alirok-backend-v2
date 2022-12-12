import { Controller, Post, Body } from '@nestjs/common';
import { users } from '@generated/client';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { InviteFriendsService } from './invite-friends.service';
import { InviteFriendsDto } from './dto/invite-friends.dto';

@Controller('invite-friends')
export class InviteFriendsController {
  constructor(private readonly inviteFriendsService: InviteFriendsService) {}

  @Roles('user')
  @Post()
  async inviteFriends(
    @Body() email: InviteFriendsDto,
    @CurrentUser() currentUser: users,
  ) {
    return this.inviteFriendsService.invite(email, currentUser);
  }
}
