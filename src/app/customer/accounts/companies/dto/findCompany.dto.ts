import { IsString } from 'class-validator';

export class FindCompanyDto {
  @IsString()
  uuid: string;
}
