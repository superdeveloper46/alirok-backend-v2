import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateRateTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  company_uuid: string;
}
