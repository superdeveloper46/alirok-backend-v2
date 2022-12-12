import { users } from '@generated/client';
import { BadRequestException, Injectable } from '@nestjs/common';
import { SendgridService } from '../../vendors/sendgrid/sendgrid.service';
import { InviteFriendsDto } from './dto/invite-friends.dto';

@Injectable()
export class InviteFriendsService {
  constructor(private readonly sendgridService: SendgridService) {}

  public async invite(email: InviteFriendsDto, currentUser: users) {
    try {
      if (!email) {
        throw new BadRequestException({
          message: 'email not provided',
        });
      }

      const { first_name, last_name } = currentUser;

      const mailerOptions = {
        to: email,
        templateId: 'd-3b14586676a246ada5160312407c5dad',
        subject: `${first_name || 'Missing name'} ${
          last_name && last_name
        } has invited you to ship with Alirok.com`,
        data: {
          buttonLink: 'http://alirok.com/',
          header: 'Do you have a package to ship? Try Alirok.com!',
          body: 'Compare rates from multiple carriers and ship your package in minutes!',
          buttonText: 'Check it out',
          avatar: currentUser.photo,
        },
      };

      await this.sendgridService.send(mailerOptions);

      return {
        message: 'Email sent successfully!',
      };
    } catch (error) {
      return error;
    }
  }
}
