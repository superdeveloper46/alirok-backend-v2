import { IsEmail, IsNotEmpty } from 'class-validator';

export class InviteFriendsDto {
  @IsEmail()
  @IsNotEmpty()
  email?: string;
}
