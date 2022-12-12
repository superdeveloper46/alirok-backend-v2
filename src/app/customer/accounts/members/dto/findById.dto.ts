import { IsString } from 'class-validator';

export class FindMemberByIdDto {
  @IsString()
  uuid?: string;
}
