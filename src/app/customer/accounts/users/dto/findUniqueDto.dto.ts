import { IsString } from 'class-validator';

export class FindUniqueDto {
  @IsString()
  uuid: string;
}
