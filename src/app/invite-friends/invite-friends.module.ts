import { Module } from '@nestjs/common';
import { SendgridModule } from 'src/vendors/sendgrid/sendgrid.module';
import { InviteFriendsController } from './invite-friends.controller';
import { InviteFriendsService } from './invite-friends.service';

@Module({
  controllers: [InviteFriendsController],
  providers: [InviteFriendsService],
  imports: [SendgridModule],
})
export class InviteFriendsModule {}
