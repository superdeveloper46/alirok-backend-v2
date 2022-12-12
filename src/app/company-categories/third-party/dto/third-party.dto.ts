import { IsString } from 'class-validator';

export class CreateData {
  @IsString()
  company_uuid: string;
}
